#Requires AutoHotkey v2
#SingleInstance Force

Joy16::  ; ← 使いたいJoyConのボタン番号に変更
{
    SendLevel 1
    Send "{F14 down}"
    KeyWait "Joy16"       ; ← ボタンを離すまで待機
    SendLevel 1
    Send "{F14 up}"
}
; ── ボタン割り当て ──
; Joy15::Send "{Enter}"
Joy3::  ; Ctrl ホールド対応
{
    Send "{Ctrl down}"
    KeyWait "Joy3"
    Send "{Ctrl up}"
}

Joy1::  ; Shift ホールド対応
{
    Send "{Shift down}"
    KeyWait "Joy1"
    Send "{Shift up}"
}

Joy5::  ; Windowsキー ホールド対応
{
    Send "{LWin down}"
    KeyWait "Joy5"
    Send "{LWin up}"
}


Joy4::Send "{Del}"
Joy2::Send "{BackSpace}"
Joy11::Send "{Enter}"

Joy9::Send "{Esc}"


Joy14::
{
    SendLevel 1
    Send "{F18 down}"
    KeyWait "Joy14"
    SendLevel 1
    Send "{F18 up}"
}
; ── ボタン15（修飾キー）押しながら操作 ──
; 左クリック（Joy15 + Joy1）
#HotIf GetKeyState("Joy15", "P")
Joy11::Click "Left"
Joy3::Click "Right"
#HotIf

; ── スクロール＆カーソル設定 ──
SetTimer StickScroll, 50

StickScroll() {
    pov := GetKeyState("JoyPOV", "P")
    joy15 := GetKeyState("Joy15", "P")
    if (joy15) {
        ; Joy15を押しながら → カーソル移動（斜め対応）
        moveSpeed := 15  ; 移動速度（ピクセル/tick）調整可
        if (pov = 0)           ; 右
            MouseMove moveSpeed, 0, 0, "R"
        else if (pov = 4500)   ; 右下
            MouseMove moveSpeed, moveSpeed, 0, "R"
        else if (pov = 9000)   ; 下
            MouseMove 0, moveSpeed, 0, "R"
        else if (pov = 13500)  ; 左下
            MouseMove -moveSpeed, moveSpeed, 0, "R"
        else if (pov = 18000)  ; 左
            MouseMove -moveSpeed, 0, 0, "R"
        else if (pov = 22500)  ; 左上
            MouseMove -moveSpeed, -moveSpeed, 0, "R"
        else if (pov = 27000)  ; 上
            MouseMove 0, -moveSpeed, 0, "R"
        else if (pov = 31500)  ; 右上
            MouseMove moveSpeed, -moveSpeed, 0, "R"
    } else {
        ; Joy15なし → 通常スクロール
        if (pov = 0)
            Send "{WheelRight}"
        else if (pov = 18000)
            Send "{WheelLeft}"
        else if (pov = 9000)
            Send "{WheelDown}"
        else if (pov = 27000)
            Send "{WheelUp}"
    }
}
F4::(dateStr := FormatTime(, "yyyy/MM/dd"), SendText(dateStr))
F3::(dateStr := FormatTime(, "yyyyMMdd"), SendText(dateStr))
F1::Send("{Enter}")
Insert::Send("{PrintScreen}")
/*
WheelLeft::Send("{Browser_Back}")     ; チルト左 → 戻る
WheelRight::Send("{Browser_Forward}") ; チルト右 → 進む
*/
#HotIf Not WinActive("Excel") ;Excelは元々Ctrl+セミコロンで日付入力になるので無効に。
^vkBB::
{
  tmp_Clip := ClipboardAll() ; クリップボードに登録してから貼り付け
  A_Clipboard := FormatTime(, "yyyy/MM/dd")
  Send "^v"
  Sleep 50 ; "^v"開始前にA_Clipboard:= tmp_Clipが完了する事があった為Sleepを入れる。
  A_Clipboard := tmp_Clip
}
#HotIf
; ノブ左回転 (F15) → 左スクロール (Shift + ホイール上)
F15::
{
    Send("+{WheelUp}")
    ToolTip("<<")
    SetTimer(() => ToolTip(), -500)
}

; ノブ右回転 (F16) → 右スクロール (Shift + ホイール下)
F16::
{
    Send("+{WheelDown}")
    ToolTip(">>")
    SetTimer(() => ToolTip(), -500)
}
#Requires AutoHotkey v2.0

; Ctrl + Shift + Alt + E で発動するように変更
^+!e:: {
    shellWindows := ComObject("Shell.Application").Windows
    if (shellWindows.Count > 0) {
        for window in shellWindows {
            if (InStr(window.FullName, "explorer.exe")) {
                hwnd := window.HWND
                
                if (WinGetMinMax("ahk_id " hwnd) = -1) {
                    WinRestore("ahk_id " hwnd)
                }
                
                WinActivate("ahk_id " hwnd)
                return ; 見つけたらここで処理終了
            }
        }
    }
    
    ; ここまで到達した（1つも開いていない）場合のみ新規起動
    Run("explorer.exe")
}