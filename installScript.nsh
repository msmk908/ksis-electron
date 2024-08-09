!macro customInstall
    ; 레지스트리에서 이전에 등록된 경우 프로토콜 제거
    DeleteRegKey HKCR "ksis"

    ; 64비트 레지스트리 뷰 설정
    SetRegView 64
    ; URL 프로토콜 핸들러 등록
    WriteRegStr HKCR "ksis" "URL Protocol" ""
    WriteRegStr HKCR "ksis\shell\open\command" "" '"$INSTDIR\ElectronReact.exe" "%1"'

    ; 32비트 레지스트리 뷰 설정
    SetRegView 32
    WriteRegStr HKCR "ksis" "URL Protocol" ""
    WriteRegStr HKCR "ksis\shell\open\command" "" '"$INSTDIR\ElectronReact.exe" "%1"'
!macroend

!macro customUnInstall
    ; 레지스트리에서 프로토콜 키 삭제
    DeleteRegKey HKCR "ksis"
!macroend