<?php
namespace App\Services;
use App\Models\Item;
use Illuminate\Support\Str;
class ItemService {
    public function generateItemCode(string $categoryCode = "GEN"): string {
        $prefix = strtoupper(substr($categoryCode, 0, 3));
        $count = Item::withTrashed()->count() + 1;
        return "{$prefix}-".str_pad($count, 6, "0", STR_PAD_LEFT);
    }
    public function generateBarcode(Item $item): string {
        return str_pad($item->id, 12, "0", STR_PAD_LEFT);
    }
}