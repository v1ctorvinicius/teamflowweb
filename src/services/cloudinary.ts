// src/services/cloudinary.ts

export interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  bytes: number
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const cloudinaryService = {
  async uploadImage(file: File): Promise<CloudinaryUploadResponse> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary credentials not configured')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo deve ter no máximo 5MB')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem')
      }

      const data = await response.json()
      return {
        public_id: data.public_id,
        secure_url: data.secure_url,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  },

  // Gera URL com transformações (opcional)
  getTransformedUrl(publicId: string, options?: { width?: number; height?: number; quality?: string }): string {
    if (!CLOUD_NAME) return ''
    
    const params = []
    if (options?.width) params.push(`w_${options.width}`)
    if (options?.height) params.push(`h_${options.height}`)
    if (options?.quality) params.push(`q_${options.quality}`)
    
    const transform = params.length > 0 ? `/${params.join(',')}` : ''
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload${transform}/${publicId}`
  },

  // Deleta imagem do Cloudinary (precisa de API key no backend)
  // Para unsigned uploads, a deleção não é possível direto
  // Será gerenciada via backend quando necessário
}