<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class GrnAttachment extends Model {
    protected $table = "grn_attachments";
    protected $fillable = ["grn_id","title","path","filename"];
    public function grn(): BelongsTo { return $this->belongsTo(GoodsReceivedNote::class,"grn_id"); }
}