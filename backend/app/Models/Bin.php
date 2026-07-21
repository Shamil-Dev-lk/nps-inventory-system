<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Bin extends Model {
    protected $fillable = ["shelf_id","code","name","capacity","is_active"];
    public function shelf(): BelongsTo { return $this->belongsTo(Shelf::class); }
}