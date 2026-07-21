<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Services\ItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function __construct(private readonly ItemService $itemService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('view-items');

        if ($request->per_page == 1000) {
            $items = Item::select('id', 'name_en', 'item_code', 'barcode', 'current_quantity', 'average_cost', 'unit_id')
                ->where('is_active', true)
                ->with('unit:id,symbol')
                ->orderBy('name_en')
                ->get();
            return response()->json(['data' => ['data' => $items]]);
        }

        $items = Item::with(['category', 'unit', 'brand', 'warehouse'])
            ->when($request->search, fn($q) => $q->where('name_en', 'like', "%{$request->search}%")
                ->orWhere('item_code', 'like', "%{$request->search}%")
                ->orWhere('barcode', 'like', "%{$request->search}%")
                ->orWhere('name_si', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->warehouse_id, fn($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->status, function ($q) use ($request) {
                return match ($request->status) {
                    'low_stock'    => $q->whereRaw('current_quantity <= reorder_level AND current_quantity > 0'),
                    'out_of_stock' => $q->where('current_quantity', '<=', 0),
                    'in_stock'     => $q->whereRaw('current_quantity > reorder_level'),
                    default        => $q,
                };
            })
            ->when($request->is_active, fn($q) => $q->where('is_active', $request->is_active === 'true'))
            ->latest()
            ->paginate($request->per_page ?? 20);

        $summary = \Illuminate\Support\Facades\Cache::remember('items.summary', 300, function () {
            return [
                'total_items'       => Item::where('is_active', true)->count(),
                'total_value'       => Item::where('is_active', true)->selectRaw('SUM(current_quantity * average_cost) as val')->value('val') ?? 0,
                'low_stock_count'   => Item::where('is_active', true)->whereRaw('current_quantity <= reorder_level AND current_quantity > 0')->count(),
                'out_of_stock_count' => Item::where('is_active', true)->where('current_quantity', '<=', 0)->count(),
            ];
        });

        return response()->json(['data' => $items, 'summary' => $summary]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create-items');

        $validated = $request->validate([
            'name_en'          => 'required|string|max:255',
            'name_si'          => 'nullable|string|max:255',
            'name_ta'          => 'nullable|string|max:255',
            'description'      => 'nullable|string',
            'specification'    => 'nullable|string',
            'category_id'      => 'nullable|exists:item_categories,id',
            'brand_id'         => 'nullable|exists:brands,id',
            'unit_id'          => 'nullable|exists:units,id',
            'warehouse_id'     => 'nullable|exists:warehouses,id',
            'purchase_price'   => 'required|numeric|min:0',
            'average_cost'     => 'nullable|numeric|min:0',
            'selling_price'    => 'nullable|numeric|min:0',
            'minimum_stock'    => 'nullable|numeric|min:0',
            'maximum_stock'    => 'nullable|numeric|min:0',
            'reorder_level'    => 'nullable|numeric|min:0',
            'location_code'    => 'nullable|string',
            'expiry_date'      => 'nullable|date',
            'batch_number'     => 'nullable|string',
            'is_consumable'    => 'boolean',
            'is_serialized'    => 'boolean',
            'track_expiry'     => 'boolean',
            'remarks'          => 'nullable|string',
            'current_quantity' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $categoryCode = $request->category_id
                ? ItemCategory::find($request->category_id)?->code ?? 'GEN'
                : 'GEN';

            $validated['item_code']     = $this->itemService->generateItemCode($categoryCode);
            $validated['barcode']       = $validated['barcode'] ?? $validated['item_code'];
            $validated['qr_code']       = $validated['qr_code'] ?? $validated['item_code'];
            $validated['average_cost']  = $validated['average_cost'] ?? $validated['purchase_price'];
            $validated['is_active']     = true;
            $validated['current_quantity'] = $validated['current_quantity'] ?? 0;
            $validated['available_quantity'] = $validated['current_quantity'];

            $item = Item::create($validated);

            \Illuminate\Support\Facades\Cache::forget('items.summary');
            DB::commit();
            AuditLog::record('item_created', "Item created: {$item->item_code} - {$item->name_en}", $item);
            if ($item->current_quantity > 0) {
                // Optionally log to ledger
                \App\Models\StockLedger::create([
                    'item_id' => $item->id,
                    'warehouse_id' => $item->warehouse_id ?? 1,
                    'transaction_type' => 'opening_stock',
                    'reference_type' => 'App\Models\Item',
                    'reference_id' => $item->id,
                    'quantity_in' => $item->current_quantity,
                    'quantity_out' => 0,
                    'balance' => $item->current_quantity,
                    'unit_cost' => $item->purchase_price,
                    'transaction_date' => now(),
                    'remarks' => 'Opening stock',
                    'created_by' => auth()->id() ?? 1,
                ]);
            }

            return response()->json([
                'message' => 'Item created successfully.',
                'data'    => $item->fresh(['category', 'unit', 'brand', 'warehouse']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(Item $item): JsonResponse
    {
        $this->authorize('view-items');
        return response()->json([
            'data' => $item->load(['category', 'unit', 'brand', 'warehouse', 'ledgerEntries' => fn($q) => $q->latest()->take(20)]),
        ]);
    }

    public function update(Request $request, Item $item): JsonResponse
    {
        $this->authorize('edit-items');

        $validated = $request->validate([
            'name_en'       => 'sometimes|required|string|max:255',
            'name_si'       => 'nullable|string|max:255',
            'name_ta'       => 'nullable|string|max:255',
            'description'   => 'nullable|string',
            'specification' => 'nullable|string',
            'category_id'   => 'nullable|exists:item_categories,id',
            'brand_id'      => 'nullable|exists:brands,id',
            'unit_id'       => 'nullable|exists:units,id',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'purchase_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'maximum_stock' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|numeric|min:0',
            'location_code' => 'nullable|string',
            'expiry_date'   => 'nullable|date',
            'batch_number'  => 'nullable|string',
            'is_consumable' => 'boolean',
            'track_expiry'  => 'boolean',
            'is_active'     => 'boolean',
            'remarks'       => 'nullable|string',
        ]);

        $item->update($validated);
        \Illuminate\Support\Facades\Cache::forget('items.summary');
        AuditLog::record('item_updated', "Item updated: {$item->item_code}", $item);

        return response()->json([
            'message' => 'Item updated successfully.',
            'data'    => $item->fresh(['category', 'unit', 'brand', 'warehouse']),
        ]);
    }

    public function destroy(Item $item): JsonResponse
    {
        $this->authorize('delete-items');

        if ($item->current_quantity > 0 && !auth()->user()->hasRole('super-admin')) {
            return response()->json(['message' => 'Cannot delete item with stock in hand.'], 422);
        }

        $item->delete();
        \Illuminate\Support\Facades\Cache::forget('items.summary');
        AuditLog::record('item_deleted', "Item deleted: {$item->item_code}", $item);

        return response()->json(['message' => 'Item deleted successfully.']);
    }

    public function categories(Request $request): JsonResponse
    {
        $categories = ItemCategory::with('children')
            ->when($request->parent_only, fn($q) => $q->whereNull('parent_id'))
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return response()->json(['data' => $categories]);
    }
}
