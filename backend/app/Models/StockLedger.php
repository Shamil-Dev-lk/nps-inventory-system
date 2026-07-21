<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StockLedger extends Model {
    protected $table = "stock_ledger";
    protected $fillable = ["item_id","warehouse_id","transaction_type","reference_number","reference_type","reference_id","quantity_in","quantity_out","balance","unit_cost","total_value","transaction_date","created_by","remarks"];
    protected $casts = ["transaction_date"=>"datetime","quantity_in"=>"decimal:3","quantity_out"=>"decimal:3","balance"=>"decimal:3","unit_cost"=>"decimal:2","total_value"=>"decimal:2"];
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
}