<?php

namespace App\Http\Controllers\Api\V1\Store;

use App\Http\Controllers\Controller;
use App\Models\ItemCategory;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ItemCategory::query();
        if ($request->has('search')) {
            $query->where('name_en', 'like', '%' . $request->search . '%');
        }
        return response()->json([
            'status' => 'success',
            'data' => $request->has('all') ? $query->get() : $query->paginate(10)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_en' => 'required|string|max:255'
        ]);
        
        $category = ItemCategory::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Created successfully',
            'data' => $category
        ], 201);
    }

    public function show(string $id)
    {
        $category = ItemCategory::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $category
        ]);
    }

    public function update(Request $request, string $id)
    {
        $category = ItemCategory::findOrFail($id);
        $category->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Updated successfully',
            'data' => $category
        ]);
    }

    public function destroy(string $id)
    {
        $category = ItemCategory::findOrFail($id);
        $category->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Deleted successfully'
        ]);
    }
}