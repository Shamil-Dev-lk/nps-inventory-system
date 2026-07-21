<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
class Project extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["project_code","name_en","name_si","name_ta","description","department_id","project_manager_id","start_date","end_date","budget","status","is_active"];
    protected $casts = ["start_date"=>"date","end_date"=>"date","budget"=>"decimal:2","is_active"=>"boolean"];
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
}