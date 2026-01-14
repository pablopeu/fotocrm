<?php
/**
 * FotoCRM API - Backend PHP
 * Sistema de Tags para catálogo de cuchillos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración
define('DATA_DIR', __DIR__ . '/../data');
define('UPLOADS_DIR', __DIR__ . '/../uploads');
define('ADMIN_USER', getenv('ADMIN_USER') ?: 'admin');
define('ADMIN_PASS', getenv('ADMIN_PASS') ?: 'admin123');

if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
if (!is_dir(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);

// Funciones de utilidad
function readJSON($filename) {
    $filepath = DATA_DIR . '/' . $filename;
    if (!file_exists($filepath)) {
        return $filename === 'categories.json'
            ? ['tag_groups' => []]
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

function getAuthorizationHeader() {
    // Intentar obtener el header Authorization de múltiples fuentes
    // (los hostings compartidos a veces lo pasan por diferentes variables)
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            return $headers['Authorization'];
        }
        // Algunos servidores lo pasan en minúsculas
        if (isset($headers['authorization'])) {
            return $headers['authorization'];
        }
    }
    return null;
}

function checkAuth() {
    $user = null;
    $pass = null;

    // Primero intentar PHP_AUTH_USER/PW (método estándar)
    if (isset($_SERVER['PHP_AUTH_USER']) && isset($_SERVER['PHP_AUTH_PW'])) {
        $user = $_SERVER['PHP_AUTH_USER'];
        $pass = $_SERVER['PHP_AUTH_PW'];
    } else {
        // Si no, intentar parsear el header Authorization manualmente
        $authHeader = getAuthorizationHeader();
        if ($authHeader && preg_match('/Basic\s+(.*)$/i', $authHeader, $matches)) {
            $decoded = base64_decode($matches[1]);
            if ($decoded && strpos($decoded, ':') !== false) {
                list($user, $pass) = explode(':', $decoded, 2);
            }
        }
    }

    if (!$user || !$pass) {
        http_response_code(401);
        echo json_encode(['error' => 'Autenticación requerida']);
        exit;
    }
    if ($user !== ADMIN_USER || $pass !== ADMIN_PASS) {
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

// Obtener la ruta
$path = isset($_GET['route']) ? $_GET['route'] : '';
if (empty($path)) {
    $requestUri = $_SERVER['REQUEST_URI'];
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    $path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
    $path = preg_replace('/^index\.php\/?/', '', $path);
}
$path = trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Router
switch (true) {
    // Health check
    case $path === 'health' && $method === 'GET':
        response(['status' => 'ok', 'timestamp' => date('c')]);
        break;

    // GET /tags - Obtener grupos de tags
    case ($path === 'tags' || $path === 'categories') && $method === 'GET':
        response(readJSON('categories.json'));
        break;

    // GET /photos - Listar fotos
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

    // GET /search - Buscar fotos por tags y texto
    case $path === 'search' && $method === 'GET':
        $query = isset($_GET['query']) ? strtolower(sanitize($_GET['query'])) : '';
        $tagsParam = isset($_GET['tags']) ? $_GET['tags'] : '';

        // Tags puede venir como string separado por comas o como array
        $filterTags = [];
        if (!empty($tagsParam)) {
            if (is_array($tagsParam)) {
                $filterTags = $tagsParam;
            } else {
                $filterTags = array_map('trim', explode(',', $tagsParam));
            }
            $filterTags = array_filter($filterTags);
        }

        $data = readJSON('photos.json');
        $results = $data['photos'];

        // Filtrar por texto
        if ($query) {
            $results = array_filter($results, fn($p) =>
                stripos($p['text'] ?? '', $query) !== false
            );
        }

        // Filtrar por tags (la foto debe tener TODOS los tags seleccionados)
        if (!empty($filterTags)) {
            $results = array_filter($results, function($p) use ($filterTags) {
                $photoTags = $p['tags'] ?? [];
                foreach ($filterTags as $tag) {
                    if (!in_array($tag, $photoTags)) {
                        return false;
                    }
                }
                return true;
            });
        }

        response(['photos' => array_values($results)]);
        break;

    // ==================
    // RUTAS ADMIN
    // ==================

    // POST /admin/tags - Crear nuevo tag en un grupo
    case $path === 'admin/tags' && $method === 'POST':
        checkAuth();
        $input = getInput();

        if (empty($input['group_id']) || empty($input['name'])) {
            response(['error' => 'group_id y name son requeridos'], 400);
        }

        $data = readJSON('categories.json');
        $tagId = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $input['name']));
        $newTag = [
            'id' => $tagId,
            'name' => sanitize($input['name'])
        ];

        $found = false;
        foreach ($data['tag_groups'] as &$group) {
            if ($group['id'] === $input['group_id']) {
                // Verificar que no exista
                foreach ($group['tags'] as $tag) {
                    if ($tag['id'] === $tagId) {
                        response(['error' => 'El tag ya existe'], 400);
                    }
                }
                $group['tags'][] = $newTag;
                $found = true;
                break;
            }
        }

        if (!$found) {
            response(['error' => 'Grupo no encontrado'], 404);
        }

        writeJSON('categories.json', $data);
        response($newTag, 201);
        break;

    // DELETE /admin/tags/{groupId}/{tagId}
    case preg_match('/^admin\/tags\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'DELETE':
        checkAuth();
        $groupId = $matches[1];
        $tagId = $matches[2];

        $data = readJSON('categories.json');
        $found = false;

        foreach ($data['tag_groups'] as &$group) {
            if ($group['id'] === $groupId) {
                foreach ($group['tags'] as $key => $tag) {
                    if ($tag['id'] === $tagId) {
                        unset($group['tags'][$key]);
                        $group['tags'] = array_values($group['tags']);
                        $found = true;
                        break 2;
                    }
                }
            }
        }

        if (!$found) {
            response(['error' => 'Tag no encontrado'], 404);
        }

        writeJSON('categories.json', $data);
        response(['message' => 'Tag eliminado']);
        break;

    // PUT /admin/tag-groups/{groupId} - Renombrar grupo
    case preg_match('/^admin\/tag-groups\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'PUT':
        checkAuth();
        $input = getInput();
        $data = readJSON('categories.json');

        $found = false;
        foreach ($data['tag_groups'] as &$group) {
            if ($group['id'] === $matches[1]) {
                if (!empty($input['name'])) {
                    $group['name'] = sanitize($input['name']);
                }
                $found = $group;
                break;
            }
        }

        if (!$found) {
            response(['error' => 'Grupo no encontrado'], 404);
        }

        writeJSON('categories.json', $data);
        response($found);
        break;

    // POST /admin/upload - Subir foto con tags
    case $path === 'admin/upload' && $method === 'POST':
        checkAuth();

        if (empty($_FILES['photos'])) {
            response(['error' => 'No se subieron archivos'], 400);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSize = 5 * 1024 * 1024;

        // Obtener tags del POST
        $tags = [];
        if (!empty($_POST['tags'])) {
            if (is_array($_POST['tags'])) {
                $tags = $_POST['tags'];
            } else {
                $tags = array_map('trim', explode(',', $_POST['tags']));
            }
            $tags = array_filter($tags);
        }

        $data = readJSON('photos.json');
        $newPhotos = [];

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
            if ($file['error'] !== UPLOAD_ERR_OK) continue;

            if (!in_array($file['type'], $allowedTypes)) {
                response(['error' => 'Tipo no permitido: ' . $file['name']], 400);
            }
            if ($file['size'] > $maxSize) {
                response(['error' => 'Archivo muy grande: ' . $file['name']], 400);
            }

            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = generateUUID() . '.' . strtolower($ext);
            $destination = UPLOADS_DIR . '/' . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                response(['error' => 'Error al guardar'], 500);
            }

            $newPhoto = [
                'id' => generateUUID(),
                'tags' => $tags,
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

    // PUT /admin/photos/{id} - Actualizar foto (tags y texto)
    case preg_match('/^admin\/photos\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'PUT':
        checkAuth();
        $input = getInput();
        $data = readJSON('photos.json');

        $found = null;
        foreach ($data['photos'] as &$photo) {
            if ($photo['id'] === $matches[1]) {
                if (isset($input['text'])) {
                    $photo['text'] = sanitize($input['text']);
                }
                if (isset($input['tags'])) {
                    $photo['tags'] = is_array($input['tags']) ? $input['tags'] : [];
                }
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
                $filepath = UPLOADS_DIR . '/' . basename($photo['url']);
                if (file_exists($filepath)) @unlink($filepath);
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

    default:
        response(['error' => 'Ruta no encontrada', 'path' => $path], 404);
}
