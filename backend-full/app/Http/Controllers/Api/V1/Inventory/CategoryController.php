<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ItemCategory;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(['data' => ItemCategory::orderBy('id', 'desc')->take(500)->get()]);
    }

    public function store(Request $request)
    {
        $item = ItemCategory::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function show(string $id)
    {
        $item = ItemCategory::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    public function update(Request $request, string $id)
    {
        $item = ItemCategory::findOrFail($id);
        $item->update($request->all());
        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = ItemCategory::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
