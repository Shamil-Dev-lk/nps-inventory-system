<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
class StockAdjustment extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["adjustment_number","adjustment_type","item_id","warehouse_id","quantity","unit_cost","reason","description","adjusted_by","approved_by","approved_at","status","adjustment_date","reference_number"];
    protected $casts = ["adjustment_date"=>"date","approved_at"=>"datetime"];
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function adjustedBy(): BelongsTo { return $this->belongsTo(User::class,"adjusted_by"); }
}