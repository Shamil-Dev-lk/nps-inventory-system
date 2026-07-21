<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Department;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Department::orderBy('id', 'desc')->take(500)->get()]);
    }

    public function store(Request $request)
    {
        $item = Department::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function show(string $id)
    {
        $item = Department::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    public function update(Request $request, string $id)
    {
        $item = Department::findOrFail($id);
        $item->update($request->all());
        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = Department::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
