import { useSearchParams } from 'react-router-dom'
import {yt_html} from '../assets/assets'
import { useEffect, useRef } from 'react'


const YtPreview = () => {

  const [searchParams]=useSearchParams()
  const thumbnail_url=searchParams.get('thumbnail_url')
  const title=searchParams.get('title')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current && thumbnail_url && title) {
      const loadImage = async () => {
        try {
          const response = await fetch(thumbnail_url)
          const blob = await response.blob()
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageDataUrl = e.target?.result as string
            const newHtml = yt_html.replace('%%THUMBNAIL_URL%%', imageDataUrl).replace('%%TITLE%%', title)
            const htmlBlob = new Blob([newHtml], { type: 'text/html' })
            const blobUrl = URL.createObjectURL(htmlBlob)
            if (iframeRef.current) {
              iframeRef.current.src = blobUrl
            }
          }
          reader.readAsDataURL(blob)
        } catch (error) {
          console.error('Failed to load image:', error)
          const newHtml = yt_html.replace('%%THUMBNAIL_URL%%', thumbnail_url).replace('%%TITLE%%', title)
          const htmlBlob = new Blob([newHtml], { type: 'text/html' })
          const blobUrl = URL.createObjectURL(htmlBlob)
          if (iframeRef.current) {
            iframeRef.current.src = blobUrl
          }
        }
      }
      loadImage()
    }
  }, [thumbnail_url, title])
  
  return (
    <div className="fixed inset-0 z-100 bg-black">
      <iframe ref={iframeRef} width="100%" height="100%" allowFullScreen ></iframe>
    </div>
  )
}

export default YtPreview