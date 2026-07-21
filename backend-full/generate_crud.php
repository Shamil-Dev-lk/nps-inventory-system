<?php
$controllers = [
    'Inventory\CategoryController' => ['Model' => 'App\Models\ItemCategory', 'Name' => 'Category'],
    'Inventory\UnitController' => ['Model' => 'App\Models\Unit', 'Name' => 'Unit'],
    'Inventory\BrandController' => ['Model' => 'App\Models\Brand', 'Name' => 'Brand'],
    'Settings\SupplierController' => ['Model' => 'App\Models\Supplier', 'Name' => 'Supplier'],
    'Settings\WarehouseController' => ['Model' => 'App\Models\Warehouse', 'Name' => 'Warehouse'],
    'Settings\DepartmentController' => ['Model' => 'App\Models\Department', 'Name' => 'Department'],
    'Settings\ProjectController' => ['Model' => 'App\Models\Project', 'Name' => 'Project'],
];

foreach ($controllers as $path => $meta) {
    $parts = explode("\\", $path);
    $namespace = "App\Http\Controllers\Api\V1\\" . $parts[0];
    $className = $parts[1];
    $model = $meta['Model'];
    $modelName = basename(str_replace('\\', '/', $model));
    $file = __DIR__ . "/app/Http/Controllers/Api/V1/" . str_replace('\\', '/', $path) . ".php";

    $code = "<?php\n\nnamespace $namespace;\n\nuse App\Http\Controllers\Controller;\nuse Illuminate\Http\Request;\nuse $model;\n\nclass $className extends Controller\n{\n";
    $code .= "    public function index()\n    {\n        return response()->json(['data' => $modelName::all()]);\n    }\n\n";
    $code .= "    public function store(Request \$request)\n    {\n        \$item = $modelName::create(\$request->all());\n        return response()->json(['data' => \$item], 201);\n    }\n\n";
    $code .= "    public function show(string \$id)\n    {\n        \$item = $modelName::findOrFail(\$id);\n        return response()->json(['data' => \$item]);\n    }\n\n";
    $code .= "    public function update(Request \$request, string \$id)\n    {\n        \$item = $modelName::findOrFail(\$id);\n        \$item->update(\$request->all());\n        return response()->json(['data' => \$item]);\n    }\n\n";
    $code .= "    public function destroy(string \$id)\n    {\n        \$item = $modelName::findOrFail(\$id);\n        \$item->delete();\n        return response()->json(['message' => 'Deleted successfully']);\n    }\n}\n";

    file_put_contents($file, $code);
    echo "Generated $file\n";
}
