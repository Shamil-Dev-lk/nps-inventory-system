<?php

namespace App\Http\Controllers\Api\V1\Stock;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\StockIssue;
use App\Models\Warehouse;
use App\Services\StockLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockIssueController extends Controller
{
    public function __construct(private readonly StockLedgerService $ledgerService) {}

    public function index(Request $request)
    {
        $this->authorize('view-stock-issues');

        $issues = StockIssue::with(['department', 'warehouse', 'issuedBy', 'officer', 'project'])
            ->when($request->search, fn($q) => $q->where('issue_number', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->when($request->from_date, fn($q) => $q->whereDate('issue_date', '>=', $request->from_date))
            ->when($request->to_date, fn($q) => $q->whereDate('issue_date', '<=', $request->to_date))
            ->latest('issue_date')
            ->paginate($request->per_page ?? 20);

        return response()->json(['data' => $issues]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create-stock-issues');

        $validated = $request->validate([
            'issue_to_type'   => 'required|in:department,officer,project',
            'department_id'   => 'nullable|exists:departments,id',
            'officer_id'      => 'nullable|exists:users,id',
            'project_id'      => 'nullable|exists:projects,id',
            'warehouse_id'    => 'required|exists:warehouses,id',
            'issue_date'      => 'required|date',
            'purpose'         => 'nullable|string',
            'remarks'         => 'nullable|string',
            'items'           => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.remarks' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $issueNumber = 'ISS-' . date('Y') . '-' . str_pad(StockIssue::count() + 1, 5, '0', STR_PAD_LEFT);

            // Validate sufficient stock
            foreach ($validated['items'] as $item) {
                $stockItem = Item::find($item['item_id']);
                if ($stockItem->available_quantity < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Insufficient stock for {$stockItem->name_en}. Available: {$stockItem->available_quantity}",
                    ], 422);
                }
            }

            $issue = StockIssue::create([
                ...$validated,
                'issue_number' => $issueNumber,
                'issued_by_id' => auth()->id(),
                'status'       => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $stockItem = Item::find($item['item_id']);
                $issue->items()->create([
                    ...$item,
                    'unit_price'  => $stockItem->average_cost,
                    'total_price' => $item['quantity'] * $stockItem->average_cost,
                ]);
            }

            DB::commit();
            AuditLog::record('stock_issue_created', "Stock issue created: {$issueNumber}", $issue);

            return response()->json([
                'message' => 'Stock issue created.',
                'data'    => $issue->load(['department', 'warehouse', 'items.item']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(StockIssue $stockIssue): JsonResponse
    {
        $this->authorize('view-stock-issues');
        return response()->json(['data' => $stockIssue->load([
            'department', 'warehouse', 'items.item', 'issuedBy', 'approvedBy', 'officer', 'project',
        ])]);
    }

    public function update(Request $request, StockIssue $stockIssue): JsonResponse
    {
        $this->authorize('create-stock-issues');

        if ($stockIssue->status !== 'draft') {
            return response()->json(['message' => 'Only draft issues can be edited.'], 422);
        }

        $stockIssue->update($request->validate([
            'purpose' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]));

        return response()->json(['message' => 'Stock issue updated.', 'data' => $stockIssue->fresh()]);
    }

    public function destroy(StockIssue $stockIssue): JsonResponse
    {
        $this->authorize('create-stock-issues');

        if ($stockIssue->status !== 'draft') {
            return response()->json(['message' => 'Only draft issues can be deleted.'], 422);
        }

        $stockIssue->delete();
        return response()->json(['message' => 'Stock issue deleted.']);
    }

    public function approve(Request $request, StockIssue $stockIssue): JsonResponse
    {
        $this->authorize('approve-stock-issues');

        if (!in_array($stockIssue->status, ['draft'])) {
            return response()->json(['message' => 'Only draft issues can be approved.'], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($stockIssue->items as $issueItem) {
                $item      = Item::find($issueItem->item_id);
                $warehouse = Warehouse::find($stockIssue->warehouse_id);

                $this->ledgerService->record(
                    $item,
                    $warehouse,
                    'issue',
                    $stockIssue->issue_number,
                    'StockIssue',
                    $stockIssue->id,
                    0,
                    $issueItem->quantity,
                    $item->average_cost,
                    "Issue: {$stockIssue->issue_number}"
                );
            }

            $stockIssue->update([
                'status'      => 'issued',
                'approved_by_id' => auth()->id(),
                'approved_at' => now(),
            ]);

            DB::commit();
            AuditLog::record('stock_issue_approved', "Stock issue approved: {$stockIssue->issue_number}", $stockIssue);

            return response()->json(['message' => 'Stock issue approved and stock deducted.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, StockIssue $stockIssue): JsonResponse
    {
        $this->authorize('approve-stock-issues');
        $request->validate(['remarks' => 'required|string']);

        $stockIssue->update([
            'status'      => 'rejected',
            'approved_by_id' => auth()->id(),
            'approved_at' => now(),
            'remarks'     => $request->remarks,
        ]);

        AuditLog::record('stock_issue_rejected', "Stock issue rejected: {$stockIssue->issue_number}", $stockIssue);
        return response()->json(['message' => 'Stock issue rejected.']);
    }
}
