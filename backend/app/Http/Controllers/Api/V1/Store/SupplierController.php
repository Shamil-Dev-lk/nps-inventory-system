<?php

namespace App\Http\Controllers\Api\V1\Store;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::when($request->search, fn($q) =>
                $q->where('company_name', 'like', "%{$request->search}%")
                  ->orWhere('supplier_code', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('company_name')
            ->paginate($request->per_page ?? 20);

        return response()->json(['data' => $suppliers]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage-suppliers');

        $validated = $request->validate([
            'company_name'   => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'address'        => 'nullable|string',
            'district'       => 'nullable|string|max:100',
            'telephone'      => 'nullable|string|max:20',
            'mobile'         => 'nullable|string|max:20',
            'email'          => 'nullable|email',
            'vat_number'     => 'nullable|string|max:50',
            'br_number'      => 'nullable|string|max:50',
            'bank_name'      => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name'   => 'nullable|string|max:255',
            'remarks'        => 'nullable|string',
        ]);

        $validated['supplier_code'] = 'SUP-' . str_pad(Supplier::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
        $supplier = Supplier::create($validated);

        AuditLog::record('supplier_created', "Supplier created: {$supplier->company_name}", $supplier);
        return response()->json(['message' => 'Supplier created.', 'data' => $supplier], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json(['data' => $supplier]);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $this->authorize('manage-suppliers');

        $validated = $request->validate([
            'company_name'   => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'address'        => 'nullable|string',
            'district'       => 'nullable|string|max:100',
            'telephone'      => 'nullable|string|max:20',
            'mobile'         => 'nullable|string|max:20',
            'email'          => 'nullable|email',
            'vat_number'     => 'nullable|string|max:50',
            'br_number'      => 'nullable|string|max:50',
            'status'         => 'sometimes|in:active,inactive,blacklisted',
            'remarks'        => 'nullable|string',
        ]);

        $supplier->update($validated);
        AuditLog::record('supplier_updated', "Supplier updated: {$supplier->company_name}", $supplier);
        return response()->json(['message' => 'Supplier updated.', 'data' => $supplier->fresh()]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $this->authorize('manage-suppliers');
        AuditLog::record('supplier_deleted', "Supplier deleted: {$supplier->company_name}", $supplier);
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted.']);
    }
}
