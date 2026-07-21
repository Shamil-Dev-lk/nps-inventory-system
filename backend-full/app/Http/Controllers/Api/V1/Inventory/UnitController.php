<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Unit;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Unit::orderBy('id', 'desc')->take(500)->get()]);
    }

    public function store(Request $request)
    {
        $item = Unit::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function show(string $id)
    {
        $item = Unit::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    public function update(Request $request, string $id)
    {
        $item = Unit::findOrFail($id);
        $item->update($request->all());
        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = Unit::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
