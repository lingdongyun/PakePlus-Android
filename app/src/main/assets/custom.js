window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug

const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )

    console.log('origin', origin, isBaseTargetBlank)

    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

window.open = function (url, target, features) {
    console.log('open', url, target, features)

    if (url) {
        location.href = url
    }

    return null
}

document.addEventListener('click', hookClick, { capture: true })

// Android WebView / 华为手机剪贴板兼容处理
;(function () {
    function fallbackCopy(text) {
        const value = String(text ?? '')

        if (!document.body) {
            console.error('clipboard fallback failed: document.body not ready')
            return false
        }

        const textarea = document.createElement('textarea')

        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.setAttribute('aria-hidden', 'true')

        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '0'
        textarea.style.width = '1px'
        textarea.style.height = '1px'
        textarea.style.opacity = '0'
        textarea.style.pointerEvents = 'none'
        textarea.style.zIndex = '-1'

        document.body.appendChild(textarea)

        textarea.focus()
        textarea.select()
        textarea.setSelectionRange(0, value.length)

        let success = false

        try {
            success = document.execCommand('copy')
            console.log('fallback clipboard result:', success)
        } catch (error) {
            console.error('fallback clipboard error:', error)
            success = false
        } finally {
            textarea.remove()
        }

        return success
    }

    function createClipboardPolyfill() {
        return {
            writeText(text) {
                const success = fallbackCopy(text)

                if (success) {
                    return Promise.resolve()
                }

                return Promise.reject(
                    new Error('Android WebView clipboard copy failed')
                )
            }
        }
    }

    function installClipboardFallback() {
        try {
            const clipboard = navigator.clipboard

            if (
                clipboard &&
                typeof clipboard.writeText === 'function'
            ) {
                const originalWriteText =
                    clipboard.writeText.bind(clipboard)

                try {
                    clipboard.writeText = function (text) {
                        const value = String(text ?? '')

                        return originalWriteText(value).catch((error) => {
                            console.warn(
                                'navigator.clipboard.writeText failed, use fallback:',
                                error
                            )

                            if (fallbackCopy(value)) {
                                return
                            }

                            throw error
                        })
                    }

                    console.log(
                        'clipboard fallback installed by direct override'
                    )
                    return
                } catch (overrideError) {
                    console.warn(
                        'direct clipboard override failed:',
                        overrideError
                    )
                }

                try {
                    Object.defineProperty(clipboard, 'writeText', {
                        configurable: true,
                        writable: true,
                        value: function (text) {
                            const value = String(text ?? '')

                            return originalWriteText(value).catch((error) => {
                                console.warn(
                                    'navigator clipboard failed, use fallback:',
                                    error
                                )

                                if (fallbackCopy(value)) {
                                    return
                                }

                                throw error
                            })
                        }
                    })

                    console.log(
                        'clipboard fallback installed by defineProperty'
                    )
                    return
                } catch (defineError) {
                    console.warn(
                        'clipboard writeText defineProperty failed:',
                        defineError
                    )
                }
            }

            try {
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: createClipboardPolyfill()
                })

                console.log('clipboard polyfill installed')
            } catch (navigatorError) {
                console.error(
                    'navigator.clipboard polyfill install failed:',
                    navigatorError
                )
            }
        } catch (error) {
            console.error('install clipboard fallback failed:', error)
        }
    }

    installClipboardFallback()

    // 某些页面会在加载后重新初始化 clipboard，再尝试安装一次
    window.addEventListener('DOMContentLoaded', installClipboardFallback)
    window.addEventListener('load', installClipboardFallback)
})()