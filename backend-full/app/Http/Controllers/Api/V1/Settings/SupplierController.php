<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Supplier::orderBy('id', 'desc')->take(500)->get()]);
    }

    public function store(Request $request)
    {
        $item = Supplier::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function show(string $id)
    {
        $item = Supplier::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    public function update(Request $request, string $id)
    {
        $item = Supplier::findOrFail($id);
        $item->update($request->all());
        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = Supplier::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
