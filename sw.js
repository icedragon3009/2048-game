/**
 * Service Worker for 2048 Game
 * 提供图片和资源缓存，提升加载速度
 */

const CACHE_NAME = '2048-game-v1.3-mobile';
const CACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './js/ImagePreloader.js',
    './js/GameCore.js',
    './js/GameUI.js',
    './js/EasterEgg.js',
    './js/InputHandler.js',
    './js/Game2048.js',
    './static/wechat-qr.png',
    './static/dache.png',
    './static/wechat-qr-mobile.png',
    './static/dache-mobile.png'
];

// 安装事件 - 预缓存资源
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker 正在安装...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 开始缓存应用资源');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                console.log('✅ 应用资源缓存完成');
                self.skipWaiting(); // 强制激活新的Service Worker
            })
            .catch((error) => {
                console.error('❌ 缓存资源失败:', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker 正在激活...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker 激活完成');
                return self.clients.claim(); // 立即控制所有客户端
            })
    );
});

// 拦截网络请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
    // 只处理GET请求
    if (event.request.method !== 'GET') {
        return;
    }
    
    const url = new URL(event.request.url);
    
    // 对于图片资源，使用缓存优先策略
    if (url.pathname.includes('/static/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg')) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('📁 从缓存返回:', url.pathname);
                        return cachedResponse;
                    }
                    
                    console.log('🌐 从网络获取:', url.pathname);
                    return fetch(event.request)
                        .then((response) => {
                            // 如果响应有效，缓存副本
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                            return response;
                        })
                        .catch((error) => {
                            console.error('❌ 网络请求失败:', url.pathname, error);
                            // 返回一个默认的错误响应或离线页面
                            return new Response('网络连接失败', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
    } else {
        // 对于其他资源，使用网络优先策略
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 如果网络请求成功，更新缓存
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // 网络失败时，尝试从缓存获取
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                console.log('📁 网络失败，从缓存返回:', url.pathname);
                                return cachedResponse;
                            }
                            return new Response('资源不可用', {
                                status: 404,
                                statusText: 'Not Found'
                            });
                        });
                })
        );
    }
});