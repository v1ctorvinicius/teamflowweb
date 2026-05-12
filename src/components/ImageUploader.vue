<!-- src/components/ImageUploader.vue -->
<template>
  <div class="image-uploader">
    <div class="uploader-header">
      <h3 class="title">Imagens do Produto</h3>
      <span class="count">{{ localImageUrls.length }}/10</span>
    </div>

    <!-- Dropzone -->
    <div
      class="dropzone"
      :class="{ 'is-dragging': isDragging, 'is-disabled': localImageUrls.length >= 10 }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <i class="pi pi-cloud-upload" />
      <p class="dropzone-text">Solte imagens aqui ou clique</p>
      <p class="dropzone-sub">Máximo 5MB por imagem</p>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="file-input"
        :disabled="localImageUrls.length >= 10"
        @change="handleFileSelect"
      />
    </div>

    <!-- Upload status -->
    <div v-if="uploading.length > 0" class="upload-status">
      <div v-for="(item, idx) in uploading" :key="`uploading-${idx}`" class="upload-item">
        <span class="filename">{{ item.file.name }}</span>
        <div class="progress">
          <div class="progress-bar" :style="{ width: item.progress + '%' }" />
        </div>
        <span class="percent">{{ item.progress }}%</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="uploadError" class="error-alert">
      <i class="pi pi-exclamation-circle" />
      {{ uploadError }}
    </div>

    <!-- Gallery de imagens (já salvas + pendentes) -->
    <div class="gallery">
      <div
        v-for="(img, idx) in allDisplayImages"
        :key="img.isPending ? `pending-${idx}` : img.url"
        class="gallery-item"
        draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragend="onDragEnd"
        @dragover.prevent
        @drop="onDrop($event, idx)"
      >
        <div class="image-container">
          <img :src="img.url" :alt="`Imagem ${idx + 1}`" />
          <div v-if="img.isPending && img.progress < 100" class="upload-overlay">
            <div class="upload-progress">{{ Math.floor(img.progress) }}%</div>
          </div>
          <div class="overlay">
            <button class="btn-delete" title="Remover" @click="removeImage(idx)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </div>
        <span class="index">#{{ idx + 1 }}</span>
        <span v-if="idx === 0" class="badge-primary">Destaque</span>
        <span v-if="img.isPending" class="badge-pending">Pendente</span>
      </div>
    </div>

    <!-- Upload status (opcional, pode remover se não quiser) -->
    <div v-if="uploading.length > 0 && false" class="upload-status">
      <!-- Escondido, pois já mostramos na galeria -->
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>Nenhuma imagem subida</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { cloudinaryService } from '@/services/cloudinary'

const props = defineProps<{
  modelValue?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'uploaded', urls: string[]): void
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploading = ref<{ file: File; progress: number; previewUrl: string }[]>([])  // 🔥 previewUrl adicionado
const uploadError = ref('')
const draggedIdx = ref<number | null>(null)

const localImageUrls = ref<string[]>(props.modelValue || [])

watch(() => props.modelValue, (newVal) => {
  localImageUrls.value = newVal || []
}, { immediate: true, deep: true })

watch(localImageUrls, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await addFilesToQueue(Array.from(target.files))
    target.value = ''
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) {
    await addFilesToQueue(Array.from(event.dataTransfer.files))
  }
}

// 🔥 Função para adicionar arquivos à fila (sem upload)
async function addFilesToQueue(files: File[]) {
  uploadError.value = ''

  const currentTotal = localImageUrls.value.length + uploading.value.length
  const canUpload = 10 - currentTotal
  
  if (files.length > canUpload) {
    uploadError.value = `Você pode adicionar no máximo ${canUpload} imagem(s) mais`
    return
  }

  const imageFiles = files.filter((f) => f.type.startsWith('image/'))
  if (imageFiles.length === 0) {
    uploadError.value = 'Nenhum arquivo de imagem selecionado'
    return
  }

  // 🔥 Adiciona à fila com preview local
  for (const file of imageFiles) {
    const previewUrl = URL.createObjectURL(file)  // Cria preview local
    uploading.value.push({ file, progress: 0, previewUrl })
  }
}

// 🔥 Preview das imagens na fila (antes do upload)
const queueImages = computed(() => {
  return uploading.value.map(item => ({
    url: item.previewUrl,
    progress: item.progress,
    isPending: true,
    file: item.file
  }))
})

// 🔥 Todas as imagens para exibição (já salvas + pendentes)
const allDisplayImages = computed(() => {
  const saved = localImageUrls.value.map(url => ({ url, progress: 100, isPending: false }))
  const pending = queueImages.value
  return [...saved, ...pending]
})

async function savePendingUploads() {
  uploadError.value = ''
  const pendingItems = [...uploading.value]
  
  if (pendingItems.length === 0) return true

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i]
    const uploadItem = uploading.value.find((u) => u.file === item.file)
    if (!uploadItem) continue

    try {
      const progressInterval = setInterval(() => {
        if (uploadItem.progress < 90) {
          uploadItem.progress += Math.random() * 30
        }
      }, 200)

      const response = await cloudinaryService.uploadImage(item.file)

      clearInterval(progressInterval)
      uploadItem.progress = 100

      emit('uploaded', [response.secure_url])
      localImageUrls.value = [...localImageUrls.value, response.secure_url]

      // Limpa preview local
      URL.revokeObjectURL(uploadItem.previewUrl)
      
      setTimeout(() => {
        uploading.value = uploading.value.filter((u) => u.file !== item.file)
      }, 500)
    } catch (error: any) {
      uploadError.value = error.message || 'Erro ao fazer upload'
      return false
    }
  }
  return true
}

function removeImage(idx: number) {
  // Verifica se é imagem já salva ou pendente
  const savedCount = localImageUrls.value.length
  if (idx < savedCount) {
    localImageUrls.value = localImageUrls.value.filter((_, i) => i !== idx)
  } else {
    const pendingIdx = idx - savedCount
    const pendingItem = uploading.value[pendingIdx]
    if (pendingItem) {
      URL.revokeObjectURL(pendingItem.previewUrl)
      uploading.value = uploading.value.filter((_, i) => i !== pendingIdx)
    }
  }
}

function handleReorder(targetIdx: number) {
  if (draggedIdx.value === null || draggedIdx.value === targetIdx) return

  const savedCount = localImageUrls.value.length
  const fromIdx = draggedIdx.value
  const toIdx = targetIdx

  // Caso 1: Movendo entre imagens salvas (já no servidor)
  if (fromIdx < savedCount && toIdx < savedCount) {
    const newUrls = [...localImageUrls.value]
    const [draggedItem] = newUrls.splice(fromIdx, 1)
    newUrls.splice(toIdx, 0, draggedItem)
    localImageUrls.value = newUrls
  }
  
  // Caso 2: Movendo entre imagens pendentes (upload ainda não feito)
  else if (fromIdx >= savedCount && toIdx >= savedCount) {
    const pendingIdx = fromIdx - savedCount
    const targetPendingIdx = toIdx - savedCount
    const newPending = [...uploading.value]
    const [draggedItem] = newPending.splice(pendingIdx, 1)
    newPending.splice(targetPendingIdx, 0, draggedItem)
    uploading.value = newPending
  }
  
  // 🔥 Caso 3: Movendo de imagem salva para posição pendente (ou vice-versa)
  else {
    // Converte tudo para um array unificado, reordena, e depois separa novamente
    
    // Cria array unificado de todas as imagens (salvas + pendentes)
    const allSaved = localImageUrls.value.map(url => ({ type: 'saved', url }))
    const allPending = uploading.value.map(item => ({ 
      type: 'pending', 
      file: item.file, 
      progress: item.progress, 
      previewUrl: item.previewUrl 
    }))
    const unified = [...allSaved, ...allPending]
    
    // Reordena
    const [draggedItem] = unified.splice(fromIdx, 1)
    unified.splice(toIdx, 0, draggedItem)
    
    // Separa novamente
    const newSaved: string[] = []
    const newPending: { file: File; progress: number; previewUrl: string }[] = []
    
    for (const item of unified) {
      if (item.type === 'saved') {
        newSaved.push(item.url)
      } else {
        newPending.push({
          file: item.file,
          progress: item.progress,
          previewUrl: item.previewUrl
        })
      }
    }
    
    localImageUrls.value = newSaved
    uploading.value = newPending
  }

  draggedIdx.value = null
}

defineExpose({
  savePendingUploads
})

function triggerFileInput() {
  if (localImageUrls.value.length >= 10) return
  fileInput.value?.click()
}

// Variável para armazenar o índice do item sendo arrastado
const dragStartIndex = ref<number | null>(null)

function onDragStart(event: DragEvent, index: number) {
  dragStartIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
  // 🔥 Isso evita que a imagem padrão do navegador apareça
  if (event.target instanceof HTMLElement) {
    event.target.style.opacity = '0.5'
  }
}

function onDragEnd(event: DragEvent) {
  if (event.target instanceof HTMLElement) {
    event.target.style.opacity = ''
  }
  dragStartIndex.value = null
}

async function onDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  
  if (dragStartIndex.value === null || dragStartIndex.value === targetIndex) {
    return
  }

  const fromIdx = dragStartIndex.value
  const toIdx = targetIndex
  const savedCount = localImageUrls.value.length

  // Caso 1: Movendo entre imagens salvas (já no servidor)
  if (fromIdx < savedCount && toIdx < savedCount) {
    const newUrls = [...localImageUrls.value]
    const [draggedItem] = newUrls.splice(fromIdx, 1)
    newUrls.splice(toIdx, 0, draggedItem)
    localImageUrls.value = newUrls
  }
  
  // Caso 2: Movendo entre imagens pendentes (upload ainda não feito)
  else if (fromIdx >= savedCount && toIdx >= savedCount) {
    const pendingIdx = fromIdx - savedCount
    const targetPendingIdx = toIdx - savedCount
    const newPending = [...uploading.value]
    const [draggedItem] = newPending.splice(pendingIdx, 1)
    newPending.splice(targetPendingIdx, 0, draggedItem)
    uploading.value = newPending
  }
  
  // Caso 3: Movendo entre tipos diferentes
  else {
    // Cria array unificado de todas as imagens
    const allSaved = localImageUrls.value.map(url => ({ type: 'saved', url }))
    const allPending = uploading.value.map(item => ({ 
      type: 'pending', 
      file: item.file, 
      progress: item.progress, 
      previewUrl: item.previewUrl 
    }))
    const unified = [...allSaved, ...allPending]
    
    // Reordena
    const [draggedItem] = unified.splice(fromIdx, 1)
    unified.splice(toIdx, 0, draggedItem)
    
    // Separa novamente
    const newSaved: string[] = []
    const newPending: { file: File; progress: number; previewUrl: string }[] = []
    
    for (const item of unified) {
      if (item.type === 'saved') {
        newSaved.push(item.url)
      } else {
        newPending.push({
          file: item.file,
          progress: item.progress,
          previewUrl: item.previewUrl
        })
      }
    }
    
    localImageUrls.value = newSaved
    uploading.value = newPending
  }

  dragStartIndex.value = null
}
</script>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  overflow-x: hidden;
}

.uploader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.count {
  font-size: 12px;
  color: #64748b;
  background: #1e293b;
  padding: 4px 10px;
  border-radius: 20px;
}

/* Dropzone */
.dropzone {
  border: 2px dashed #334155;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: #0f172a;
}

.dropzone:hover {
  border-color: #475569;
  background: #1a2541;
}

.dropzone.is-dragging {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
}

.dropzone.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.dropzone i {
  font-size: 28px;
  color: #60a5fa;
  display: block;
  margin-bottom: 8px;
}

.dropzone-text {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 2px;
}

.dropzone-sub {
  font-size: 11px;
  color: #64748b;
  margin: 0;
}

.file-input {
  display: none;
}

/* Upload status */
.upload-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filename {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress {
  flex: 1;
  height: 4px;
  background: #1e293b;
  border-radius: 2px;
  overflow: hidden;
  min-width: 80px;
  max-width: 100%;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #1d4ed8);
  transition: width 0.2s;
}

.percent {
  font-size: 10px;
  color: #64748b;
  flex-shrink: 0;
  width: 30px;
  text-align: right;
}

/* Error */
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.3);
  border-radius: 8px;
  color: #f43f5e;
  font-size: 12px;
}

/* Gallery */
.gallery {
  display: flex;
  flex-direction: row;
  gap: 10px;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 8px;
  scrollbar-width: thin;
  max-width: 100%;
}

.gallery-item {
  cursor: grab;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 65px;
  flex-shrink: 0;
}

.gallery-item:active {
  cursor: grabbing;
}
.gallery-item.drag-over {
  transform: scale(1.02);
}

.image-container {
  position: relative;
  width: 65px;
  height: 65px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #334155;
  background: #1e293b;
  flex-shrink: 0;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.gallery-item:hover .overlay {
  opacity: 1;
}

.btn-delete {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ef4444;
  border: none;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #dc2626;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-progress {
  color: white;
  font-weight: bold;
  font-size: 12px;
  background: #3b82f6;
  padding: 2px 6px;
  border-radius: 12px;
}

.badge-pending {
  background: #f59e0b;
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 8px;
  text-align: center;
  width: fit-content;
}

.index {
  font-size: 9px;
  color: #64748b;
  text-align: center;
}

.badge-primary {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #2563eb;
  padding: 2px 5px;
  border-radius: 4px;
  text-align: center;
  width: fit-content;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 24px 16px;
  color: #64748b;
  font-size: 12px;
}

/* 🔥 Responsivo para telas muito pequenas */
@media (max-width: 640px) {
  .gallery {
    grid-template-columns: repeat(auto-fill, minmax(55px, 55px));
    gap: 8px;
  }

  .gallery-item {
    width: 55px;
  }
  
  .image-container {
    width: 55px;
    height: 55px;
  }
  
  .dropzone {
    padding: 16px;
  }
  
  .dropzone i {
    font-size: 24px;
  }
  
  .dropzone-text {
    font-size: 12px;
  }
  
  .upload-item {
    flex-wrap: wrap;
  }
  
  .filename {
    max-width: 100%;
    flex: 1;
  }
  
  .progress {
    min-width: 100%;
    order: 1;
  }
  
  .percent {
    order: 2;
  }
}

/* 🔥 Indicação visual de que está arrastando */
.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0.5;
  z-index: 9999;
}
</style>