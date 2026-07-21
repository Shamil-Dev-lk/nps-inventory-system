<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StockIssueItem extends Model {
    protected $fillable = ["stock_issue_id","item_id","quantity","unit_price","total_price","remarks"];
    public function stockIssue(): BelongsTo { return $this->belongsTo(StockIssue::class); }
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
}