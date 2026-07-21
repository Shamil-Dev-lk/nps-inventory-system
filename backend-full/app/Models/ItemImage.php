<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ItemImage extends Model {
    protected $fillable = ["item_id","path","filename","is_primary","sort_order"];
    protected $casts = ["is_primary"=>"boolean"];
    protected $appends = ["url"];
    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
    public function getUrlAttribute(): string { return asset("storage/".$this->path); }
}