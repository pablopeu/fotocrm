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
define('CONFIG_FILE', DATA_DIR . '/config.json');

// Cargar configuración de usuario/contraseña
function getConfig() {
    if (file_exists(CONFIG_FILE)) {
        $config = json_decode(file_get_contents(CONFIG_FILE), true);
        if ($config) return $config;
    }
    return ['user' => 'admin', 'pass' => 'admin123'];
}

function saveConfig($config) {
    file_put_contents(CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT));
}

$CONFIG = getConfig();
define('ADMIN_USER', $CONFIG['user']);
define('ADMIN_PASS', $CONFIG['pass']);

// Leer input UNA sola vez y almacenarlo globalmente
$RAW_INPUT = file_get_contents('php://input');
$JSON_INPUT = json_decode($RAW_INPUT, true) ?: [];

if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
if (!is_dir(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);

// Inicializar archivos JSON si no existen
function initializeData() {
    $categoriesFile = DATA_DIR . '/categories.json';
    $photosFile = DATA_DIR . '/photos.json';
    $bucketsFile = DATA_DIR . '/buckets.json';

    // Inicializar categories.json si no existe
    if (!file_exists($categoriesFile)) {
        $defaultCategories = [
            'tag_groups' => [
                [
                    'id' => 'tipo',
                    'name' => 'Tipo',
                    'tags' => []
                ],
                [
                    'id' => 'encabado',
                    'name' => 'Encabado',
                    'tags' => []
                ],
                [
                    'id' => 'acero',
                    'name' => 'Acero',
                    'tags' => []
                ],
                [
                    'id' => 'extras',
                    'name' => 'Extras',
                    'tags' => []
                ]
            ]
        ];
        file_put_contents($categoriesFile, json_encode($defaultCategories, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // Inicializar photos.json si no existe
    if (!file_exists($photosFile)) {
        $defaultPhotos = ['photos' => []];
        file_put_contents($photosFile, json_encode($defaultPhotos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // Inicializar buckets.json si no existe
    if (!file_exists($bucketsFile)) {
        $defaultBuckets = ['buckets' => []];
        file_put_contents($bucketsFile, json_encode($defaultBuckets, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

// Ejecutar inicialización
initializeData();

// Funciones de utilidad
function readJSON($filename) {
    $filepath = DATA_DIR . '/' . $filename;

    // Determinar estructura por defecto
    $defaultStructure = ['photos' => []];
    if ($filename === 'categories.json') {
        $defaultStructure = ['tag_groups' => []];
    } elseif ($filename === 'buckets.json') {
        $defaultStructure = ['buckets' => []];
    }

    // Verificar si el archivo existe
    if (!file_exists($filepath)) {
        error_log("readJSON: File not found - $filepath");
        return $defaultStructure;
    }

    // Leer el contenido del archivo
    $content = file_get_contents($filepath);
    if ($content === false) {
        error_log("readJSON: Failed to read file - $filepath");
        return $defaultStructure;
    }

    // Decodificar JSON
    $data = json_decode($content, true);

    // Si hay error en el JSON, devolver estructura por defecto
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("readJSON: JSON decode error - " . json_last_error_msg() . " in $filepath");
        return $defaultStructure;
    }

    // Si $data es null pero no hubo error, devolver estructura por defecto
    if ($data === null) {
        error_log("readJSON: Data is null (valid JSON null) in $filepath");
        return $defaultStructure;
    }

    return $data;
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
    global $JSON_INPUT;
    $user = null;
    $pass = null;

    // 1. Intentar desde parámetros POST/JSON (método más compatible)
    if (!empty($_POST['auth_user']) && !empty($_POST['auth_pass'])) {
        $user = $_POST['auth_user'];
        $pass = $_POST['auth_pass'];
    } elseif (!empty($JSON_INPUT['auth_user']) && !empty($JSON_INPUT['auth_pass'])) {
        $user = $JSON_INPUT['auth_user'];
        $pass = $JSON_INPUT['auth_pass'];
    }
    // 2. Intentar desde query string (para GET requests)
    elseif (!empty($_GET['auth_user']) && !empty($_GET['auth_pass'])) {
        $user = $_GET['auth_user'];
        $pass = $_GET['auth_pass'];
    }
    // 3. Intentar PHP_AUTH (si el hosting lo permite)
    elseif (isset($_SERVER['PHP_AUTH_USER']) && isset($_SERVER['PHP_AUTH_PW'])) {
        $user = $_SERVER['PHP_AUTH_USER'];
        $pass = $_SERVER['PHP_AUTH_PW'];
    }
    // 4. Intentar header Authorization manual
    else {
        $authHeader = null;
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

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
    global $JSON_INPUT;
    return $JSON_INPUT;
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

    // Admin verify (verificar credenciales)
    case $path === 'admin/verify' && $method === 'GET':
        checkAuth();
        response(['status' => 'ok', 'message' => 'Authenticated']);
        break;

    // PUT /admin/password - Cambiar contraseña
    case $path === 'admin/password' && $method === 'PUT':
        checkAuth();
        $input = getInput();

        if (empty($input['new_password'])) {
            response(['error' => 'new_password es requerido'], 400);
        }

        $newPass = $input['new_password'];
        if (strlen($newPass) < 6) {
            response(['error' => 'La contraseña debe tener al menos 6 caracteres'], 400);
        }

        $config = getConfig();
        $config['pass'] = $newPass;
        saveConfig($config);

        response(['status' => 'ok', 'message' => 'Contraseña actualizada']);
        break;

    // GET /tags - Obtener grupos de tags
    case ($path === 'tags' || $path === 'categories') && $method === 'GET':
        response(readJSON('categories.json'));
        break;

    // GET /photos - Listar fotos
    case $path === 'photos' && $method === 'GET':
        response(readJSON('photos.json'));
        break;

    // GET /buckets - Obtener buckets de upload
    case $path === 'buckets' && $method === 'GET':
        response(readJSON('buckets.json'));
        break;

    // DELETE /admin/buckets/{id} - Eliminar un bucket (no las fotos, solo el bucket)
    case preg_match('/^admin\/buckets\/([a-zA-Z0-9-]+)$/', $path, $matches) && $method === 'DELETE':
        checkAuth();

        $bucketId = $matches[1];
        $data = readJSON('buckets.json');

        $originalCount = count($data['buckets']);
        $data['buckets'] = array_values(array_filter($data['buckets'], fn($b) => $b['id'] !== $bucketId));

        if (count($data['buckets']) === $originalCount) {
            response(['error' => 'Bucket no encontrado'], 404);
        }

        writeJSON('buckets.json', $data);
        response(['message' => 'Bucket eliminado']);
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

        // Guardar fotos en archivo general
        writeJSON('photos.json', $data);

        // Crear nuevo bucket con estas fotos
        if (!empty($newPhotos)) {
            $bucketsData = readJSON('buckets.json');
            $newBucket = [
                'id' => generateUUID(),
                'created_at' => date('c'),
                'photos' => $newPhotos
            ];

            // Agregar al inicio del array (más reciente primero)
            array_unshift($bucketsData['buckets'], $newBucket);

            // Mantener solo los últimos 5 buckets (FIFO)
            if (count($bucketsData['buckets']) > 5) {
                $bucketsData['buckets'] = array_slice($bucketsData['buckets'], 0, 5);
            }

            writeJSON('buckets.json', $bucketsData);

            response(['photos' => $newPhotos, 'bucket_id' => $newBucket['id']], 201);
        } else {
            response(['photos' => $newPhotos], 201);
        }
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
