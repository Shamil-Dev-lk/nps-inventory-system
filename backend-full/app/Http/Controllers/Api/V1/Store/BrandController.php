<?php

namespace App\Http\Controllers\Api\V1\Store;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::query();
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
        
        $brand = Brand::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Created successfully',
            'data' => $brand
        ], 201);
    }

    public function show(string $id)
    {
        $brand = Brand::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $brand
        ]);
    }

    public function update(Request $request, string $id)
    {
        $brand = Brand::findOrFail($id);
        $brand->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Updated successfully',
            'data' => $brand
        ]);
    }

    public function destroy(string $id)
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Deleted successfully'
        ]);
    }
}