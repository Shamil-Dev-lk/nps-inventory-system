<?php

namespace App\Http\Controllers\Api\V1\Purchase;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PurchaseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('view-purchase-requests');

        $prs = PurchaseRequest::with(['department', 'requestedBy', 'approvedBy'])
            ->when($request->search, fn($q) => $q->where('pr_number', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->when($request->from_date, fn($q) => $q->whereDate('created_at', '>=', $request->from_date))
            ->when($request->to_date, fn($q) => $q->whereDate('created_at', '<=', $request->to_date))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json(['data' => $prs]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create-purchase-requests');

        $validated = $request->validate([
            'department_id'  => 'nullable|exists:departments,id',
            'project_id'     => 'nullable|exists:projects,id',
            'required_date'  => 'nullable|date',
            'purpose'        => 'nullable|string',
            'priority'       => 'nullable|in:low,normal,high,urgent',
            'remarks'        => 'nullable|string',
            'items'          => 'required|array|min:1',
            'items.*.item_id'              => 'required|exists:items,id',
            'items.*.quantity'             => 'required|numeric|min:0.001',
            'items.*.estimated_unit_price' => 'nullable|numeric|min:0',
            'items.*.specification'        => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $prNumber = 'PR-' . date('Y') . '-' . str_pad(PurchaseRequest::count() + 1, 5, '0', STR_PAD_LEFT);

            $pr = PurchaseRequest::create([
                ...$validated,
                'pr_number'    => $prNumber,
                'requested_by' => auth()->id(),
                'status'       => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $pr->items()->create($item);
            }

            DB::commit();
            AuditLog::record('pr_created', "Purchase Request created: {$prNumber}", $pr);

            return response()->json([
                'message' => 'Purchase request created.',
                'data'    => $pr->load(['department', 'items.item', 'requestedBy']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed: ' . $e->getMessage()], 500);
        }
    }

    public function show(PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('view-purchase-requests');
        return response()->json(['data' => $purchaseRequest->load(['department', 'items.item', 'requestedBy', 'approvedBy'])]);
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('create-purchase-requests');

        if (!in_array($purchaseRequest->status, ['draft'])) {
            return response()->json(['message' => 'Only draft requests can be edited.'], 422);
        }

        $purchaseRequest->update($request->validate([
            'purpose'       => 'nullable|string',
            'priority'      => 'nullable|in:low,normal,high,urgent',
            'required_date' => 'nullable|date',
            'remarks'       => 'nullable|string',
        ]));

        return response()->json(['message' => 'Purchase request updated.', 'data' => $purchaseRequest->fresh()]);
    }

    public function destroy(PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('create-purchase-requests');

        if ($purchaseRequest->status !== 'draft') {
            return response()->json(['message' => 'Only draft requests can be deleted.'], 422);
        }

        $purchaseRequest->delete();
        return response()->json(['message' => 'Purchase request deleted.']);
    }

    public function submit(PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('create-purchase-requests');

        if ($purchaseRequest->status !== 'draft') {
            return response()->json(['message' => 'Only draft requests can be submitted.'], 422);
        }

        $purchaseRequest->update(['status' => 'submitted']);
        AuditLog::record('pr_submitted', "PR submitted: {$purchaseRequest->pr_number}", $purchaseRequest);

        return response()->json(['message' => 'Purchase request submitted for approval.']);
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('approve-purchase-requests');

        if ($purchaseRequest->status !== 'submitted') {
            return response()->json(['message' => 'Only submitted requests can be approved.'], 422);
        }

        $purchaseRequest->update([
            'status'           => 'approved',
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $request->remarks,
        ]);

        AuditLog::record('pr_approved', "PR approved: {$purchaseRequest->pr_number}", $purchaseRequest);
        return response()->json(['message' => 'Purchase request approved.']);
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('approve-purchase-requests');

        $request->validate(['remarks' => 'required|string']);

        $purchaseRequest->update([
            'status'           => 'rejected',
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $request->remarks,
        ]);

        AuditLog::record('pr_rejected', "PR rejected: {$purchaseRequest->pr_number}", $purchaseRequest);
        return response()->json(['message' => 'Purchase request rejected.']);
    }
}
