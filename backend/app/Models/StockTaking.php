<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class StockTaking extends Model {
    use HasFactory, SoftDeletes;
    protected $table = "stock_taking";
    protected $fillable = ["st_number","title","warehouse_id","count_date","initiated_by","approved_by","approved_at","status","remarks"];
    protected $casts = ["count_date"=>"date","approved_at"=>"datetime"];
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function items(): HasMany { return $this->hasMany(StockTakingItem::class); }
}