<?php
$basePath = 'C:/Users/USER/.gemini/antigravity/scratch/antigravity/backend-full/app/Http/Controllers/Api/V1';

$controllers = [
    'Settings/DepartmentController.php' => ['Department', 'App\Models\Department', 'department'],
    'Settings/ProjectController.php' => ['Project', 'App\Models\Project', 'project'],
    'Settings/SupplierController.php' => ['Supplier', 'App\Models\Supplier', 'supplier'],
    'Settings/WarehouseController.php' => ['Warehouse', 'App\Models\Warehouse', 'warehouse'],
    'Store/BrandController.php' => ['Brand', 'App\Models\Brand', 'brand'],
    'Store/CategoryController.php' => ['ItemCategory', 'App\Models\ItemCategory', 'category'],
    'Store/UnitController.php' => ['Unit', 'App\Models\Unit', 'unit'],
];

foreach ($controllers as $path => [$modelName, $modelClass, $varName]) {
    $fullPath = $basePath . '/' . $path;
    $namespace = str_replace('/', '\\', 'App\Http\Controllers\Api\V1\\' . dirname($path));
    $className = basename($path, '.php');
    
    $content = <<<PHP
<?php

namespace {$namespace};

use App\Http\Controllers\Controller;
use {$modelClass};
use Illuminate\Http\Request;

class {$className} extends Controller
{
    public function index(Request \$request)
    {
        \$query = {$modelName}::query();
        if (\$request->has('search')) {
            \$query->where('name_en', 'like', '%' . \$request->search . '%');
        }
        return response()->json([
            'status' => 'success',
            'data' => \$request->has('all') ? \$query->get() : \$query->paginate(10)
        ]);
    }

    public function store(Request \$request)
    {
        \$validated = \$request->validate([
            'name_en' => 'required|string|max:255'
        ]);
        
        \${$varName} = {$modelName}::create(\$request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Created successfully',
            'data' => \${$varName}
        ], 201);
    }

    public function show(string \$id)
    {
        \${$varName} = {$modelName}::findOrFail(\$id);
        return response()->json([
            'status' => 'success',
            'data' => \${$varName}
        ]);
    }

    public function update(Request \$request, string \$id)
    {
        \${$varName} = {$modelName}::findOrFail(\$id);
        \${$varName}->update(\$request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Updated successfully',
            'data' => \${$varName}
        ]);
    }

    public function destroy(string \$id)
    {
        \${$varName} = {$modelName}::findOrFail(\$id);
        \${$varName}->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Deleted successfully'
        ]);
    }
}
PHP;
    file_put_contents($fullPath, $content);
    echo "Generated " . $className . "\n";
}
