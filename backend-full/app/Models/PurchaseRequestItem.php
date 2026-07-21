<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PurchaseRequestItem extends Model {
    protected $fillable = ["purchase_request_id","item_id","quantity","estimated_unit_price","specification","remarks"];
    public function purchaseRequest(): BelongsTo { return $this->belongsTo(PurchaseRequest::class); }
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
}