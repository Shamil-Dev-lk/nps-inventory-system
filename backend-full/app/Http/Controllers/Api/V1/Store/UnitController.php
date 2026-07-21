<?php

namespace App\Http\Controllers\Api\V1\Store;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::query();
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
        
        $unit = Unit::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Created successfully',
            'data' => $unit
        ], 201);
    }

    public function show(string $id)
    {
        $unit = Unit::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $unit
        ]);
    }

    public function update(Request $request, string $id)
    {
        $unit = Unit::findOrFail($id);
        $unit->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Updated successfully',
            'data' => $unit
        ]);
    }

    public function destroy(string $id)
    {
        $unit = Unit::findOrFail($id);
        $unit->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Deleted successfully'
        ]);
    }
}