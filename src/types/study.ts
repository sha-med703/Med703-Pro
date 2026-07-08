export interface StudyRecord {
  id: string
  subject: string
  chapter: string
  content: string
  duration: number
  durationText: string
  startTime: string
  endTime: string
  date: string
}

export interface ReviewTask {
  id: string
  studyRecordId: string
  subject: string
  chapter: string
  content: string
  reviewDate: string
  round: number
  done: boolean
}