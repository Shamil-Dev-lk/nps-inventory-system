<?php

namespace App\Http\Controllers\Api\V1\Purchase;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('view-purchase-orders');

        $orders = PurchaseOrder::with(['supplier', 'createdBy'])
            ->when($request->search, fn($q) => $q->where('po_number', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->supplier_id, fn($q) => $q->where('supplier_id', $request->supplier_id))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json(['data' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create-purchase-orders');

        $validated = $request->validate([
            'supplier_id'             => 'required|exists:suppliers,id',
            'purchase_request_id'     => 'nullable|exists:purchase_requests,id',
            'order_date'              => 'required|date',
            'expected_delivery_date'  => 'nullable|date',
            'terms_conditions'        => 'nullable|string',
            'remarks'                 => 'nullable|string',
            'items'                   => 'required|array|min:1',
            'items.*.item_id'         => 'required|exists:items,id',
            'items.*.quantity'        => 'required|numeric|min:0.001',
            'items.*.unit_price'      => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_percent'     => 'nullable|numeric|min:0|max:100',
            'items.*.specification'   => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);
            $poNumber = 'PO-' . date('Y') . '-' . str_pad(PurchaseOrder::count() + 1, 5, '0', STR_PAD_LEFT);

            $po = PurchaseOrder::create([
                ...$validated,
                'po_number'  => $poNumber,
                'subtotal'   => $subtotal,
                'total_amount' => $subtotal,
                'created_by' => auth()->id(),
                'status'     => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $totalPrice = $item['quantity'] * $item['unit_price'];
                $po->items()->create([
                    ...$item,
                    'total_price' => $totalPrice,
                ]);
            }

            DB::commit();
            AuditLog::record('po_created', "Purchase Order created: {$poNumber}", $po);

            return response()->json([
                'message' => 'Purchase order created.',
                'data'    => $po->load(['supplier', 'items.item']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed: ' . $e->getMessage()], 500);
        }
    }

    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $this->authorize('view-purchase-orders');
        return response()->json(['data' => $purchaseOrder->load(['supplier', 'items.item', 'createdBy'])]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $this->authorize('create-purchase-orders');

        if ($purchaseOrder->status !== 'draft') {
            return response()->json(['message' => 'Only draft orders can be edited.'], 422);
        }

        $purchaseOrder->update($request->validate([
            'expected_delivery_date' => 'nullable|date',
            'terms_conditions'       => 'nullable|string',
            'remarks'                => 'nullable|string',
        ]));

        return response()->json(['message' => 'Purchase order updated.', 'data' => $purchaseOrder->fresh()]);
    }

    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $this->authorize('create-purchase-orders');

        if ($purchaseOrder->status !== 'draft') {
            return response()->json(['message' => 'Only draft orders can be deleted.'], 422);
        }

        $purchaseOrder->delete();
        return response()->json(['message' => 'Purchase order deleted.']);
    }

    public function send(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $this->authorize('create-purchase-orders');
        $purchaseOrder->update(['status' => 'sent']);
        AuditLog::record('po_sent', "PO sent to supplier: {$purchaseOrder->po_number}", $purchaseOrder);
        return response()->json(['message' => 'Purchase order sent to supplier.']);
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $this->authorize('approve-purchase-orders');

        $purchaseOrder->update([
            'status'      => 'acknowledged',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        AuditLog::record('po_approved', "PO approved: {$purchaseOrder->po_number}", $purchaseOrder);
        return response()->json(['message' => 'Purchase order approved.']);
    }
}
