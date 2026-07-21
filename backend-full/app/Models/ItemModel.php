<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
class ItemModel extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["code","name","brand_id","specifications","is_active"];
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
}