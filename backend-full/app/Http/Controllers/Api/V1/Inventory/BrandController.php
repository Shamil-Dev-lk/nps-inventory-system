<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Brand;

class BrandController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Brand::orderBy('id', 'desc')->take(500)->get()]);
    }

    public function store(Request $request)
    {
        $item = Brand::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function show(string $id)
    {
        $item = Brand::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    public function update(Request $request, string $id)
    {
        $item = Brand::findOrFail($id);
        $item->update($request->all());
        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = Brand::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
