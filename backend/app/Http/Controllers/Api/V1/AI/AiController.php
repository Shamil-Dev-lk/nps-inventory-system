<?php

namespace App\Http\Controllers\Api\V1\AI;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\OrganizationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;

class AiController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $this->authorize('use-ai-features');
        $request->validate(['message' => 'required|string|max:1000']);

        $org = OrganizationSetting::getInstance();

        if (!$org->enable_ai_features) {
            return response()->json(['message' => 'AI features are not enabled.'], 403);
        }

        $totalItems  = Item::count();
        $lowStock    = Item::lowStock()->count();
        $outOfStock  = Item::outOfStock()->count();
        $totalValue  = number_format(Item::selectRaw('COALESCE(SUM(current_quantity * average_cost), 0) as total')->value('total'), 2);
        $context     = "Total items: {$totalItems}, Low stock: {$lowStock}, Out of stock: {$outOfStock}, Total value: LKR {$totalValue}";

        try {
            if ($org->openai_api_key) {
                config(['openai.api_key' => $org->openai_api_key]);
            }

            $response = OpenAI::chat()->create([
                'model'    => config('openai.model', 'gpt-4o-mini'),
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => "You are an intelligent inventory assistant for {$org->name_en}, a Sri Lankan Pradeshiya Sabha government institution. " .
                                     "Context: {$context}. Reply concisely in the language the user uses.",
                    ],
                    ['role' => 'user', 'content' => $request->message],
                ],
                'max_tokens' => 500,
            ]);

            return response()->json([
                'reply'    => $response->choices[0]->message->content,
                'ai_model' => config('openai.model', 'gpt-4o-mini'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'reply' => 'AI service unavailable. Please check your OpenAI API configuration.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function inventorySummary(): JsonResponse
    {
        $this->authorize('use-ai-features');

        $lowStockItems = Item::lowStock()->with('category')->take(10)->get();
        $outOfStock    = Item::outOfStock()->count();
        $totalValue    = Item::selectRaw('COALESCE(SUM(current_quantity * average_cost), 0) as total')->value('total');

        return response()->json([
            'summary'         => "Inventory: {$outOfStock} items out of stock. Total value: LKR " . number_format($totalValue, 2),
            'low_stock_items' => $lowStockItems,
            'total_value'     => $totalValue,
            'out_of_stock_count' => $outOfStock,
            'ai_powered'      => OrganizationSetting::getInstance()->enable_ai_features,
        ]);
    }

    public function purchaseRecommendations(): JsonResponse
    {
        $this->authorize('use-ai-features');

        $recommendations = Item::with(['category', 'unit'])
            ->where('is_active', true)
            ->lowStock()
            ->orderBy('current_quantity')
            ->take(20)
            ->get()
            ->map(fn($item) => [
                'id'             => $item->id,
                'item_code'      => $item->item_code,
                'name'           => $item->name_en,
                'current_qty'    => $item->current_quantity,
                'reorder_level'  => $item->reorder_level,
                'maximum_stock'  => $item->maximum_stock,
                'recommended_qty' => max($item->maximum_stock - $item->current_quantity, $item->reorder_level * 2),
                'unit'           => $item->unit?->symbol,
                'estimated_cost' => $item->purchase_price * max($item->maximum_stock - $item->current_quantity, $item->reorder_level * 2),
            ]);

        return response()->json([
            'recommendations'      => $recommendations,
            'total_estimated_cost' => $recommendations->sum('estimated_cost'),
            'generated_at'         => now()->toDateTimeString(),
        ]);
    }

    public function detectDuplicates(): JsonResponse
    {
        $this->authorize('use-ai-features');

        $items = Item::select('id', 'item_code', 'name_en', 'category_id')->where('is_active', true)->get();

        $potentialDuplicates = [];
        foreach ($items as $item) {
            $similar = $items->filter(function ($other) use ($item) {
                if ($other->id === $item->id) return false;
                similar_text(strtolower($item->name_en), strtolower($other->name_en), $percent);
                return $percent > 80 && $item->category_id === $other->category_id;
            });
            if ($similar->isNotEmpty()) {
                $potentialDuplicates[] = ['item' => $item, 'similar_items' => $similar->values()];
            }
        }

        return response()->json(['potential_duplicates' => $potentialDuplicates, 'count' => count($potentialDuplicates)]);
    }

    public function dashboardSummary(): JsonResponse
    {
        $this->authorize('use-ai-features');

        $totalItems = Item::count();
        $lowStock   = Item::lowStock()->count();
        $outOfStock = Item::outOfStock()->count();
        $totalValue = Item::selectRaw('COALESCE(SUM(current_quantity * average_cost), 0) as total')->value('total');

        return response()->json([
            'summary' => [
                'total_items'  => $totalItems,
                'low_stock'    => $lowStock,
                'out_of_stock' => $outOfStock,
                'total_value'  => $totalValue,
                'health_score' => $totalItems > 0 ? round((($totalItems - $outOfStock - $lowStock) / $totalItems) * 100) : 0,
            ],
        ]);
    }
}
