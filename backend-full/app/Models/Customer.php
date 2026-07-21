<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'address', 'nic', 'designation'
    ];
}
