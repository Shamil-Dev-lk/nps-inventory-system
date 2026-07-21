<?php

namespace App\Http\Controllers\Api\V1\Store;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Warehouse;
use App\Models\Shelf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $warehouses = Warehouse::when($request->search, fn($q) =>
                $q->where('name_en', 'like', "%{$request->search}%"))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name_en')
            ->get();

        return response()->json(['data' => $warehouses]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage-warehouses');

        $validated = $request->validate([
            'code'      => 'required|string|unique:warehouses,code',
            'name_en'   => 'required|string|max:255',
            'name_si'   => 'nullable|string|max:255',
            'name_ta'   => 'nullable|string|max:255',
            'address'   => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
            'telephone' => 'nullable|string|max:20',
            'capacity'  => 'nullable|numeric|min:0',
            'is_main'   => 'boolean',
        ]);

        $warehouse = Warehouse::create($validated);
        AuditLog::record('warehouse_created', "Warehouse created: {$warehouse->name_en}", $warehouse);
        return response()->json(['message' => 'Warehouse created.', 'data' => $warehouse], 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return response()->json(['data' => $warehouse->load('shelves', 'manager')]);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('manage-warehouses');

        $validated = $request->validate([
            'name_en'   => 'sometimes|string|max:255',
            'name_si'   => 'nullable|string|max:255',
            'address'   => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $warehouse->update($validated);
        AuditLog::record('warehouse_updated', "Warehouse updated: {$warehouse->name_en}", $warehouse);
        return response()->json(['message' => 'Warehouse updated.', 'data' => $warehouse->fresh()]);
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('manage-warehouses');
        AuditLog::record('warehouse_deleted', "Warehouse deleted: {$warehouse->name_en}", $warehouse);
        $warehouse->delete();
        return response()->json(['message' => 'Warehouse deleted.']);
    }

    public function shelves(Warehouse $warehouse): JsonResponse
    {
        return response()->json(['data' => $warehouse->shelves()->with('bins')->get()]);
    }

    public function bins(Warehouse $warehouse, Shelf $shelf): JsonResponse
    {
        abort_if($shelf->warehouse_id !== $warehouse->id, 404);
        return response()->json(['data' => $shelf->bins()->where('is_active', true)->get()]);
    }
}
