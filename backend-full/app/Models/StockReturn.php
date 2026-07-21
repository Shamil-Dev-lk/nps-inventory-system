<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class StockReturn extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["return_number","stock_issue_id","department_id","officer_id","warehouse_id","return_date","returned_by","received_by","approved_by","approved_at","status","remarks"];
    protected $casts = ["return_date"=>"date","approved_at"=>"datetime"];
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function returnedBy(): BelongsTo { return $this->belongsTo(User::class,"returned_by"); }
    public function items(): HasMany { return $this->hasMany(StockReturnItem::class); }
}