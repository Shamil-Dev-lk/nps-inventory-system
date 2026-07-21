<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransfer extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["transfer_number","transfer_type","from_warehouse_id","to_warehouse_id","from_department_id","to_department_id","transfer_date","initiated_by","approved_by","approved_at","status","reason","remarks"];
    protected $casts = ["transfer_date"=>"date","approved_at"=>"datetime"];

    public function items(): HasMany { return $this->hasMany(StockTransferItem::class); }
    public function fromWarehouse(): BelongsTo { return $this->belongsTo(Warehouse::class, 'from_warehouse_id'); }
    public function toWarehouse(): BelongsTo { return $this->belongsTo(Warehouse::class, 'to_warehouse_id'); }
    public function fromDepartment(): BelongsTo { return $this->belongsTo(Department::class, 'from_department_id'); }
    public function toDepartment(): BelongsTo { return $this->belongsTo(Department::class, 'to_department_id'); }
    public function initiatedBy(): BelongsTo { return $this->belongsTo(User::class, 'initiated_by'); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
}