<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class GrnItem extends Model {
    protected $table = "grn_items";
    protected $fillable = ["grn_id","item_id","purchase_order_item_id","ordered_quantity","received_quantity","accepted_quantity","rejected_quantity","unit_price","total_price","batch_number","expiry_date","remarks"];
    protected $casts = ["expiry_date"=>"date"];
    public function grn(): BelongsTo { return $this->belongsTo(GoodsReceivedNote::class,"grn_id"); }
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
}