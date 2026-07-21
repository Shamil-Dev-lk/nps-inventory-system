<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StockTakingItem extends Model {
    protected $fillable = ["stock_taking_id","item_id","system_quantity","physical_quantity","variance","unit_cost","variance_reason","is_adjusted"];
    public function stockTaking(): BelongsTo { return $this->belongsTo(StockTaking::class); }
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
}