<?php
/**
 * FotoCRM API - Backend PHP
 * Compatible con hosting compartido (cPanel)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración
define('DATA_DIR', __DIR__ . '/../data');
define('UPLOADS_DIR', __DIR__ . '/../uploads');
define('ADMIN_USER', getenv('ADMIN_USER') ?: 'admin');
define('ADMIN_PASS', getenv('ADMIN_PASS') ?: 'admin123');

// Crear directorios si no existen
if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
if (!is_dir(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);

// Funciones de utilidad
function readJSON($filename) {
    $filepath = DATA_DIR . '/' . $filename;
    if (!file_exists($filepath)) {
        return $filename === 'categories.json'
            ? ['categories' => [], 'steel_types' => []]
            : ['photos' => []];
    }
    return json_decode(file_get_contents($filepath), true);
}

function writeJSON($filename, $data) {
    $filepath = DATA_DIR . '/' . $filename;
    file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function sanitize($str) {
    if (!is_string($str)) return $str;
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function checkAuth() {
    if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])) {
        header('WWW-Authenticate: Basic realm="FotoCRM Admin"');
        http_response_code(401);
        echo json_encode(['error' => 'Autenticación requerida']);
        exit;
    }
    if ($_SERVER['PHP_AUTH_USER'] !== ADMIN_USER || $_SERVER['PHP_AUTH_PW'] !== ADMIN_PASS) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit;
    }
}

function response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

// Obtener la ruta de la petición
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Router
switch (true) {
    // Health check
    case $path === 'health' && $method === 'GET':
        response(['status' => 'ok', 'timestamp' => date('c')]);
        break;

    // GET /categories
    case $path === 'categories' && $method === 'GET':
        response(readJSON('categories.json'));
        break;

    // GET /photos
    case $path === 'photos' && $method === 'GET':
        response(readJSON('photos.json'));
        break;

    // GET /photos/{id}
    case preg_match('/^photos\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'GET':
        $data = readJSON('photos.json');
        $photo = array_filter($data['photos'], fn($p) => $p['id'] === $matches[1]);
        $photo = array_values($photo);
        if (empty($photo)) {
            response(['error' => 'Foto no encontrada'], 404);
        }
        response($photo[0]);
        break;

    // GET /search
    case $path === 'search' && $method === 'GET':
        $query = isset($_GET['query']) ? strtolower(sanitize($_GET['query'])) : '';
        $steel = isset($_GET['steel']) ? strtolower(sanitize($_GET['steel'])) : '';
        $category = isset($_GET['category']) ? sanitize($_GET['category']) : '';

        $data = readJSON('photos.json');
        $results = $data['photos'];

        if ($query) {
            $results = array_filter($results, fn($p) =>
                stripos($p['text'] ?? '', $query) !== false ||
                stripos($p['name'] ?? '', $query) !== false
            );
        }
        if ($steel) {
            $results = array_filter($results, fn($p) =>
                strtolower($p['steel_type'] ?? '') === $steel
            );
        }
        if ($category) {
            $results = array_filter($results, fn($p) => $p['cat_id'] === $category);
        }

        response(['photos' => array_values($results)]);
        break;

    // ==================
    // RUTAS ADMIN (protegidas)
    // ==================

    // POST /admin/categories
    case $path === 'admin/categories' && $method === 'POST':
        checkAuth();
        $input = getInput();
        if (empty($input['name'])) {
            response(['error' => 'Nombre requerido'], 400);
        }

        $data = readJSON('categories.json');
        $newCategory = [
            'id' => generateUUID(),
            'name' => sanitize($input['name']),
            'parent_id' => $input['parent_id'] ?? null,
            'children' => []
        ];

        if (!empty($input['parent_id'])) {
            // Función recursiva para encontrar y agregar al padre
            $addToParent = function(&$categories, $parentId, $newCat) use (&$addToParent) {
                foreach ($categories as &$cat) {
                    if ($cat['id'] === $parentId) {
                        $cat['children'][] = $newCat;
                        return true;
                    }
                    if (!empty($cat['children']) && $addToParent($cat['children'], $parentId, $newCat)) {
                        return true;
                    }
                }
                return false;
            };
            $addToParent($data['categories'], $input['parent_id'], $newCategory);
        } else {
            $data['categories'][] = $newCategory;
        }

        writeJSON('categories.json', $data);
        response($newCategory, 201);
        break;

    // PUT /admin/categories/{id}
    case preg_match('/^admin\/categories\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'PUT':
        checkAuth();
        $input = getInput();
        $data = readJSON('categories.json');

        $updateCategory = function(&$categories, $id, $name) use (&$updateCategory) {
            foreach ($categories as &$cat) {
                if ($cat['id'] === $id) {
                    $cat['name'] = sanitize($name);
                    return $cat;
                }
                if (!empty($cat['children'])) {
                    $result = $updateCategory($cat['children'], $id, $name);
                    if ($result) return $result;
                }
            }
            return null;
        };

        $updated = $updateCategory($data['categories'], $matches[1], $input['name'] ?? '');
        if (!$updated) {
            response(['error' => 'Categoría no encontrada'], 404);
        }

        writeJSON('categories.json', $data);
        response($updated);
        break;

    // DELETE /admin/categories/{id}
    case preg_match('/^admin\/categories\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'DELETE':
        checkAuth();
        $data = readJSON('categories.json');

        $deleteCategory = function(&$categories, $id) use (&$deleteCategory) {
            foreach ($categories as $key => &$cat) {
                if ($cat['id'] === $id) {
                    unset($categories[$key]);
                    return true;
                }
                if (!empty($cat['children']) && $deleteCategory($cat['children'], $id)) {
                    return true;
                }
            }
            return false;
        };

        if (!$deleteCategory($data['categories'], $matches[1])) {
            response(['error' => 'Categoría no encontrada'], 404);
        }

        $data['categories'] = array_values($data['categories']);
        writeJSON('categories.json', $data);
        response(['message' => 'Categoría eliminada']);
        break;

    // POST /admin/upload
    case $path === 'admin/upload' && $method === 'POST':
        checkAuth();

        if (empty($_FILES['photos'])) {
            response(['error' => 'No se subieron archivos'], 400);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        $data = readJSON('photos.json');
        $newPhotos = [];

        // Normalizar $_FILES para múltiples archivos
        $files = [];
        if (is_array($_FILES['photos']['name'])) {
            for ($i = 0; $i < count($_FILES['photos']['name']); $i++) {
                $files[] = [
                    'name' => $_FILES['photos']['name'][$i],
                    'type' => $_FILES['photos']['type'][$i],
                    'tmp_name' => $_FILES['photos']['tmp_name'][$i],
                    'error' => $_FILES['photos']['error'][$i],
                    'size' => $_FILES['photos']['size'][$i]
                ];
            }
        } else {
            $files[] = $_FILES['photos'];
        }

        foreach ($files as $file) {
            if ($file['error'] !== UPLOAD_ERR_OK) {
                continue;
            }

            if (!in_array($file['type'], $allowedTypes)) {
                response(['error' => 'Tipo de archivo no permitido: ' . $file['name']], 400);
            }

            if ($file['size'] > $maxSize) {
                response(['error' => 'Archivo demasiado grande: ' . $file['name']], 400);
            }

            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = generateUUID() . '.' . strtolower($ext);
            $destination = UPLOADS_DIR . '/' . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                response(['error' => 'Error al guardar archivo'], 500);
            }

            $newPhoto = [
                'id' => generateUUID(),
                'cat_id' => $_POST['cat_id'] ?? null,
                'steel_type' => sanitize($_POST['steel_type'] ?? ''),
                'url' => 'uploads/' . $filename,
                'text' => sanitize($_POST['text'] ?? ''),
                'created_at' => date('c')
            ];

            $newPhotos[] = $newPhoto;
            $data['photos'][] = $newPhoto;
        }

        writeJSON('photos.json', $data);
        response(['photos' => $newPhotos], 201);
        break;

    // PUT /admin/photos/{id}
    case preg_match('/^admin\/photos\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'PUT':
        checkAuth();
        $input = getInput();
        $data = readJSON('photos.json');

        $found = false;
        foreach ($data['photos'] as &$photo) {
            if ($photo['id'] === $matches[1]) {
                if (isset($input['text'])) $photo['text'] = sanitize($input['text']);
                if (isset($input['cat_id'])) $photo['cat_id'] = $input['cat_id'];
                if (isset($input['steel_type'])) $photo['steel_type'] = sanitize($input['steel_type']);
                $photo['updated_at'] = date('c');
                $found = $photo;
                break;
            }
        }

        if (!$found) {
            response(['error' => 'Foto no encontrada'], 404);
        }

        writeJSON('photos.json', $data);
        response($found);
        break;

    // DELETE /admin/photos/{id}
    case preg_match('/^admin\/photos\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'DELETE':
        checkAuth();
        $data = readJSON('photos.json');

        $found = null;
        foreach ($data['photos'] as $key => $photo) {
            if ($photo['id'] === $matches[1]) {
                $found = $photo;
                // Eliminar archivo físico
                $filepath = UPLOADS_DIR . '/' . basename($photo['url']);
                if (file_exists($filepath)) {
                    @unlink($filepath);
                }
                unset($data['photos'][$key]);
                break;
            }
        }

        if (!$found) {
            response(['error' => 'Foto no encontrada'], 404);
        }

        $data['photos'] = array_values($data['photos']);
        writeJSON('photos.json', $data);
        response(['message' => 'Foto eliminada']);
        break;

    // Ruta no encontrada
    default:
        response(['error' => 'Ruta no encontrada', 'path' => $path], 404);
}
