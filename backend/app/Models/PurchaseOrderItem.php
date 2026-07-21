<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PurchaseOrderItem extends Model {
    protected $fillable = ["purchase_order_id","item_id","quantity","received_quantity","unit_price","discount_percent","tax_percent","total_price","specification"];
    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class); }
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
}