<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Warehouse;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Warehouse::orderBy('id', 'desc')->take(500)->get()]);
    }

    public function store(Request $request)
    {
        $item = Warehouse::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function show(string $id)
    {
        $item = Warehouse::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    public function update(Request $request, string $id)
    {
        $item = Warehouse::findOrFail($id);
        $item->update($request->all());
        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = Warehouse::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
