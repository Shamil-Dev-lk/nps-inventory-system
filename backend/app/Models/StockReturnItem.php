<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StockReturnItem extends Model {
    protected $fillable = ["stock_return_id","item_id","quantity","condition","reason"];
    public function stockReturn(): BelongsTo { return $this->belongsTo(StockReturn::class); }
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
}