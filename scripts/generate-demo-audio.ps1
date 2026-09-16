# Creates labelled synthetic meeting samples using the installed Windows Korean voice.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
Add-Type -AssemblyName System.Speech
$taskLinesJson = & node --experimental-strip-types scripts/demo-audio-lines.mjs
if ($LASTEXITCODE -ne 0) { throw 'Could not load the meeting scenario.' }
$taskLines = $taskLinesJson | ConvertFrom-Json
$taskAudioDirectory = Join-Path (Get-Location) 'src/assets/demo-audio'
New-Item -ItemType Directory -Force -Path $taskAudioDirectory | Out-Null
$taskSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $taskVoice = $taskSynth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'ko-KR' } | Select-Object -First 1
    if (-not $taskVoice) { throw 'Install a Korean Windows speech voice before regenerating the samples.' }
    $taskSynth.SelectVoice($taskVoice.VoiceInfo.Name)
    $taskImports = @()
    $taskEntries = @()
    foreach ($taskLine in $taskLines) {
        $taskPath = Join-Path $taskAudioDirectory ($taskLine.id + '.wav')
        $taskFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
        $taskSynth.SetOutputToWaveFile($taskPath, $taskFormat)
        $taskSynth.Speak($taskLine.text)
        $taskSynth.SetOutputToNull()
        # Read RIFF chunks instead of assuming a fixed WAV header.
        $taskBytes = [IO.File]::ReadAllBytes($taskPath)
        $taskPosition = 12
        $taskDataSize = 0
        while ($taskPosition + 8 -le $taskBytes.Length) {
            $taskChunk = [Text.Encoding]::ASCII.GetString($taskBytes, $taskPosition, 4)
            $taskChunkSize = [BitConverter]::ToUInt32($taskBytes, $taskPosition + 4)
            if ($taskChunk -eq 'data') { $taskDataSize = $taskChunkSize; break }
            $taskPosition += 8 + $taskChunkSize + ($taskChunkSize % 2)
        }
        if ($taskDataSize -eq 0) { throw 'Generated WAV has no sample data.' }
        $taskDuration = [Math]::Ceiling($taskDataSize / 32000.0 * 1000)
        $taskName = 'audio' + $taskImports.Count
        $taskImports += 'import ' + $taskName + ' from "../assets/demo-audio/' + $taskLine.id + '.wav";'
        $taskEntries += '  "' + $taskLine.id + '": { src: ' + $taskName + ', durationMs: ' + $taskDuration + ' },'
    }
    $taskOutput = '// Synthetic samples: Windows ' + $taskVoice.VoiceInfo.Name + ', 16 kHz PCM mono. Not meeting recordings.' + [Environment]::NewLine + ($taskImports -join [Environment]::NewLine) + [Environment]::NewLine + 'export const demoAudio: Record<string, { src: string; durationMs: number }> = {' + [Environment]::NewLine + ($taskEntries -join [Environment]::NewLine) + [Environment]::NewLine + '};'
    Set-Content -LiteralPath 'src/data/demo-audio.ts' -Value $taskOutput -Encoding utf8
    Write-Output ('Generated ' + $taskLines.Count + ' synthetic meeting audio files.')
}
finally { $taskSynth.Dispose() }
