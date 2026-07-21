<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ItemAttachment extends Model {
    protected $fillable = ["item_id","title","path","filename","mime_type","file_size"];
    protected $appends = ["url"];
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
    public function getUrlAttribute(): string { return asset("storage/".$this->path); }
}