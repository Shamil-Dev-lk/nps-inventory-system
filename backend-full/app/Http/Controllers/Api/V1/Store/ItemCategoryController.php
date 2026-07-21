<?php

namespace App\Http\Controllers\Api\V1\Store;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\ItemCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = ItemCategory::with('parent', 'children')
            ->when($request->search, fn($q) => $q->where('name_en', 'like', "%{$request->search}%"))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name_en')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage-categories');

        $validated = $request->validate([
            'name_en'   => 'required|string|max:255',
            'name_si'   => 'nullable|string|max:255',
            'name_ta'   => 'nullable|string|max:255',
            'code'      => 'required|string|unique:item_categories,code',
            'parent_id' => 'nullable|exists:item_categories,id',
            'icon'      => 'nullable|string',
            'color'     => 'nullable|string|max:7',
            'description' => 'nullable|string',
        ]);

        $category = ItemCategory::create($validated);
        AuditLog::record('category_created', "Category created: {$category->name_en}", $category);

        return response()->json(['message' => 'Category created.', 'data' => $category], 201);
    }

    public function show(ItemCategory $category): JsonResponse
    {
        return response()->json(['data' => $category->load('parent', 'children')]);
    }

    public function update(Request $request, ItemCategory $category): JsonResponse
    {
        $this->authorize('manage-categories');

        $validated = $request->validate([
            'name_en'   => 'sometimes|string|max:255',
            'name_si'   => 'nullable|string|max:255',
            'name_ta'   => 'nullable|string|max:255',
            'code'      => 'sometimes|string|unique:item_categories,code,' . $category->id,
            'parent_id' => 'nullable|exists:item_categories,id',
            'icon'      => 'nullable|string',
            'color'     => 'nullable|string|max:7',
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update($validated);
        AuditLog::record('category_updated', "Category updated: {$category->name_en}", $category);

        return response()->json(['message' => 'Category updated.', 'data' => $category->fresh()]);
    }

    public function destroy(ItemCategory $category): JsonResponse
    {
        $this->authorize('manage-categories');

        if (Item::where('category_id', $category->id)->exists()) {
            return response()->json(['message' => 'Cannot delete category with associated items.'], 422);
        }

        AuditLog::record('category_deleted', "Category deleted: {$category->name_en}", $category);
        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
