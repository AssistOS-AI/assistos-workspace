export class Personality {
    static defaultPersonalityImage='data:image/png;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QF6RXhpZgAATU0AKgAAAPAABgEOAAIAAABIAAAAZgESAAMAAAABAAEAAAEaAAUAAAABAAAAVgEbAAUAAAABAAAAXgEoAAMAAAABAAIAAIdpAAQAAAABAAAArgAAAAAAAABIAAAAAQAAAEgAAAABRGVmYXVsdCBwcm9maWxlIHBpY3R1cmUsIGF2YXRhciwgcGhvdG8gcGxhY2Vob2xkZXIuIFZlY3RvciBpbGx1c3RyYXRpb24AAAWQAAAHAAAABDAyMjGgAAAHAAAABDAxMDCgAQADAAAAAf//AACgAgAEAAAAAQAAAk+gAwAEAAAAAQAAAk8AAAAAAAgBDgACAAAASAAAAGYBEgADAAAAAQABAAABGgAFAAAAAQAAAFYBGwAFAAAAAQAAAF4BKAADAAAAAQACAAABOwACAAAADQAAAVaCmAACAAAADQAAAWSHaQAEAAAAAQAAAK4AAAAAY3VtYWNyZWF0aXZlAABjdW1hY3JlYXRpdmUAAP/hE+FodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ4IDc5LjE2NDA1MCwgMjAxOS8xMC8wMS0xODowMzoxNiAgICAgICAgIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOmRhbT0iaHR0cDovL3d3dy5kYXkuY29tL2RhbS8xLjAiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHZXR0eUltYWdlc0dJRlQ9Imh0dHA6Ly94bXAuZ2V0dHlpbWFnZXMuY29tL2dpZnQvMS4wLyIKICAgIHhtbG5zOklwdGM0eG1wQ29yZT0iaHR0cDovL2lwdGMub3JnL3N0ZC9JcHRjNHhtcENvcmUvMS4wL3htbG5zLyIKICAgIHhtbG5zOnhtcFJpZ2h0cz0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3JpZ2h0cy8iCiAgICB4bWxuczpjcT0iaHR0cDovL3d3dy5kYXkuY29tL2pjci9jcS8xLjAiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICBwaG90b3Nob3A6Q291bnRyeT0iVW5zcGVjaWZpZWQiCiAgIHBob3Rvc2hvcDpEYXRlQ3JlYXRlZD0iMjAyMC0wNS0wOFQxMDowMDowMC4wMDArMTA6MDAiCiAgIHBob3Rvc2hvcDpJbnN0cnVjdGlvbnM9Ik5vdCBSZWxlYXNlZCAoTlIpICIKICAgcGhvdG9zaG9wOkNyZWRpdD0iR2V0dHkgSW1hZ2VzL2lTdG9ja3Bob3RvIgogICBwaG90b3Nob3A6VVJMPSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20iCiAgIHBob3Rvc2hvcDpTb3VyY2U9ImlTdG9ja3Bob3RvIgogICBwaG90b3Nob3A6Q29weXJpZ2h0RmxhZz0idHJ1ZSIKICAgcGhvdG9zaG9wOlVyZ2VuY3k9IjMiCiAgIHBob3Rvc2hvcDpIZWFkbGluZT0iRGVmYXVsdCBwcm9maWxlIHBpY3R1cmUsIGF2YXRhciwgcGhvdG8gcGxhY2Vob2xkZXIuIFZlY3RvciBpbGx1c3RyYXRpb24iCiAgIHBob3Rvc2hvcDpBdXRob3JzUG9zaXRpb249IkNvbnRyaWJ1dG9yIgogICBkYW06UGh5c2ljYWxoZWlnaHRpbmluY2hlcz0iOC4yMDgzMzMwMTU0NDE4OTUiCiAgIGRhbTpQaHlzaWNhbHdpZHRoaW5pbmNoZXM9IjguMjA4MzMzMDE1NDQxODk1IgogICBkYW06RmlsZWZvcm1hdD0iSlBFRyIKICAgZGFtOlByb2dyZXNzaXZlPSJubyIKICAgZGFtOmV4dHJhY3RlZD0iMjAyMS0wNy0yNFQxNTo0NDoxNS41MjgrMTA6MDAiCiAgIGRhbTpTcGVjaWFsSW5zdHJ1Y3Rpb25zPSJOb3QgUmVsZWFzZWQgKE5SKSAiCiAgIGRhbTpCaXRzcGVycGl4ZWw9IjI0IgogICBkYW06TUlNRXR5cGU9ImltYWdlL2pwZWciCiAgIGRhbTpQaHlzaWNhbHdpZHRoaW5kcGk9IjcyIgogICBkYW06UGh5c2ljYWxoZWlnaHRpbmRwaT0iNzIiCiAgIGRhbTpOdW1iZXJvZmltYWdlcz0iMSIKICAgZGFtOk51bWJlcm9mdGV4dHVhbGNvbW1lbnRzPSIwIgogICBkYW06c2hhMT0iM2ZlODQwNzEzMzM4ZWEzZmFjOWQ4MWI3ZTg5ZjJjNTk4NmRiOTFlNSIKICAgZGFtOnNpemU9IjIyMjc3IgogICBkYzpmb3JtYXQ9ImltYWdlL2pwZWciCiAgIGRjOm1vZGlmaWVkPSIyMDIxLTA3LTI0VDE1OjQ1OjMxLjAwMysxMDowMCIKICAgR2V0dHlJbWFnZXNHSUZUOkFzc2V0SUQ9IjEyMjM2NzEzOTIiCiAgIEdldHR5SW1hZ2VzR0lGVDpEbHJlZj0iZmt2SVA2NlpRSUsrcmsraDB1aUhEQT09IgogICBHZXR0eUltYWdlc0dJRlQ6SW1hZ2VSYW5rPSIzIgogICBJcHRjNHhtcENvcmU6Q291bnRyeUNvZGU9IlVOUyIKICAgeG1wUmlnaHRzOldlYlN0YXRlbWVudD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL2xlZ2FsL2xpY2Vuc2UtYWdyZWVtZW50P3V0bV9tZWRpdW09b3JnYW5pYyZhbXA7dXRtX3NvdXJjZT1nb29nbGUmYW1wO3V0bV9jYW1wYWlnbj1pcHRjdXJsIj4KICAgPGRjOmNyZWF0b3I+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpPmN1bWFjcmVhdGl2ZTwvcmRmOmxpPgogICAgPC9yZGY6U2VxPgogICA8L2RjOmNyZWF0b3I+CiAgIDxkYzpkZXNjcmlwdGlvbj4KICAgIDxyZGY6QWx0PgogICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+RGVmYXVsdCBwcm9maWxlIHBpY3R1cmUsIGF2YXRhciwgcGhvdG8gcGxhY2Vob2xkZXIuIFZlY3RvciBpbGx1c3RyYXRpb248L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICAgPGRjOnJpZ2h0cz4KICAgIDxyZGY6QWx0PgogICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+Y3VtYWNyZWF0aXZlPC9yZGY6bGk+CiAgICA8L3JkZjpBbHQ+CiAgIDwvZGM6cmlnaHRzPgogICA8ZGM6c3ViamVjdD4KICAgIDxyZGY6QmFnPgogICAgIDxyZGY6bGk+cHJvZmlsZTwvcmRmOmxpPgogICAgIDxyZGY6bGk+YmxhbmsgYXZhdGFyPC9yZGY6bGk+CiAgICAgPHJkZjpsaS8+CiAgICA8L3JkZjpCYWc+CiAgIDwvZGM6c3ViamVjdD4KICAgPGRjOmRhdGU+CiAgICA8cmRmOkJhZz4KICAgICA8cmRmOmxpPjIwMjAwNTA4PC9yZGY6bGk+CiAgICA8L3JkZjpCYWc+CiAgIDwvZGM6ZGF0ZT4KICAgPGRjOnRpdGxlPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5CbGFuayBhdmF0YXI8L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzp0aXRsZT4KICAgPHhtcFJpZ2h0czpVc2FnZVRlcm1zPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5BbGwgUmlnaHRzIFJlc2VydmVkPC9yZGY6bGk+CiAgICA8L3JkZjpBbHQ+CiAgIDwveG1wUmlnaHRzOlVzYWdlVGVybXM+CiAgIDxjcTp0YWdzPgogICAgPHJkZjpCYWc+CiAgICAgPHJkZjpsaT51bnN3OndvcmtpbmctZmlsZXMvc3RvY2staW1hZ2U8L3JkZjpsaT4KICAgIDwvcmRmOkJhZz4KICAgPC9jcTp0YWdzPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMjIzNjcxMzkyLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pv/tAjhQaG90b3Nob3AgMy4wADhCSU0EBAAAAAABhhwBWgADGyVHHAIAAAIABBwCBQAMQmxhbmsgYXZhdGFyHAIKAAEzHAIZAAdwcm9maWxlHAIZAAxibGFuayBhdmF0YXIcAigAEk5vdCBSZWxlYXNlZCAoTlIpIBwCNwAIMjAyMDA1MDgcAjwACzEwMDAwMCsxMDAwHAJQAAxjdW1hY3JlYXRpdmUcAlUAC0NvbnRyaWJ1dG9yHAJkAANVTlMcAmUAC1Vuc3BlY2lmaWVkHAJpAEdEZWZhdWx0IHByb2ZpbGUgcGljdHVyZSwgYXZhdGFyLCBwaG90byBwbGFjZWhvbGRlci4gVmVjdG9yIGlsbHVzdHJhdGlvbhwCbgAYR2V0dHkgSW1hZ2VzL2lTdG9ja3Bob3RvHAJzAAtpU3RvY2twaG90bxwCdAAMY3VtYWNyZWF0aXZlHAJ4AEdEZWZhdWx0IHByb2ZpbGUgcGljdHVyZSwgYXZhdGFyLCBwaG90byBwbGFjZWhvbGRlci4gVmVjdG9yIGlsbHVzdHJhdGlvbjhCSU0ECwAAAAAAbWh0dHBzOi8vd3d3LmlzdG9ja3Bob3RvLmNvbS9sZWdhbC9saWNlbnNlLWFncmVlbWVudD91dG1fbWVkaXVtPW9yZ2FuaWMmdXRtX3NvdXJjZT1nb29nbGUmdXRtX2NhbXBhaWduPWlwdGN1cmwAOEJJTQQlAAAAAAAQcgcSj10qqI7TMLdYYQaM7//bAEMAAQEBAQEBAQEBAQEBAQEBAgEBAQEBAgEBAQICAgICAgICAgMDBAMDAwMDAgIDBAMDBAQEBAQCAwUFBAQFBAQEBP/bAEMBAQEBAQEBAgEBAgQDAgMEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBP/AABEIAk8CTwMBEQACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP78KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgA9up9ByaAOB8VfFL4eeCA48U+MNB0edOtlPfrNqR+ltHulP/fNOz7Cul1PBNb/AGzvhRpxkj0mz8U+IpFOEktNLTTbR/o9w6tj32VXJInnR5rf/t0pll0v4aylf4ZNS8TKjH6pHAcf99GmodxOfY55/wBuTxUWzH8P/Dqr2Emu3bt+YjFP2ceoe0fVCx/tyeKA3774feHnXuI9eu42/WI0ezj0D2j7HSaf+3RbkhdW+G10g/il0zxKkx/BJIF/9CpODvoCmup6dof7ZXwj1Noo9UTxN4bkbAd9R0gX1qhP/TS3eQ4HqVFJwaGpps998LfEbwJ41RW8KeLNC1xmBY21lqEZvkA/vW7ESr+K1LTW5V09jtPbv6dxSGFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAhYKCWIAAySegHc0AfLnxP/au+H/gWS50rQCfG/iKEmKS20q4EWi2LjjFxfYZSQcZSESHgglTVxg3uQ5pbHwh47/aN+K3j1p4bvxDJoGkzEgaL4XL6RabT/DJMG8+X33vg/wB0dKtQSIc2zwskszOxLO5LO7Hc8hPUs3Un3NUSJQAUAFABQAUAFAD45JIpUnikkinjbdHNE5imjPqrjBB9waPID6B8B/tN/FbwO0Nu+tHxXo8WFOleKGe/dVHGIrzPnpx0yzqP7pqXBPYpSaPvT4X/ALT3w8+Ir22l3Uz+EfE05EaaPrc6i1vXP8NpecRyE9kfZIeyGs3FrU0Ukz6Qzn/64wakoKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgDl/GHjPw34D0K78R+KdUt9L0u0G0ySndNcyEEpBBGPmklbHyooJPXgAkCV9EDdtWflv8Zf2l/FvxLkutH0V7nwt4LZjGNMtp9mqaynQNfzIeh6+RGdg/iMh5rZRSMXJs+ZwAAAAAAMAAYAqiQoAKACgAoAKACgAoAKACgAoAOvBAI9CMigD6y+C/7UviTwG9noHjF7zxR4QUrBHNJIbjxBoSdAYJGP76JR/wAsZDkAfI4+6YlBPVFxlbc/Trw54l0Lxbo9lr/hzU7TV9I1CPzbW9tJN8b4+8rDqrqeGRgGUgggVm007M0TT1RuUhhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAcT8QPH/AIe+G3hm+8UeJLkxWdqPKtrWHD3uqXDAmO2t0P3pHwfZQGZiFBNNK7sJuyufj18U/it4n+LHiGTWtenMNlbs8eh6FBKzadokLH7qD+KRgB5kxG5yOyhVGySS0MXJvc8ypiCgAoAKACgAoAKACgAoAKACgAoAKACgD2P4OfGbxH8IddF3YtJqPhy/mU+IPDkku23vlHHnQk8R3Cj7snRsbXyvRSipFRlZn7AeEfF2geOfD2neJ/DV8l/pOpxeZDIBsngYcSQzR9UkjOVZDyCO4wTi007M1TT1R0tIYUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQBm6xq+m6BpWo63rF5Dp+l6VZyX9/eXDbYreKNSzsfXgcAckkAckU0ruwH41fGr4u6r8XfFkuqz+daeHtNZ7XwxozthbKAn5ppF6efNgNI3YBUHC86xio+pjKVzx6qJCgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAPfvgB8abz4SeJwl9JNP4L12ZIfEVipMn2M8KmoQJ/z0iH31H+sjBHJVMTJXRUZNOx+wVpdW19a217ZzxXVpeW6XVrcwOJYLiORQ8ciMOCrKwII6g1ibFigAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAPzf/bC+Lz6lqafCrQbojTtJkS98XzQP8t5djD29kSOqwArI46GRkB/1dawjpzMzm+h8L1ZmFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB+h/7HXxda6hl+FGvXW6azik1DwbPM5LyQrl7nTwT18vJljH9wyL0QCs5rqaQl0Z981maBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB5v8WvH9t8M/AOv+LZvLe7s7YW2jWsh4vb6c+Xax47jed7f7Eb00ruwm7K5+JF7eXeo3l3qN/cSXd/f3Ul7e3Up3S3M0rmSWRj6szMfxrcwK1ABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAa2g65qXhrW9K8Q6NObbVdFv4tSsJv4VkiYMA3qrYKsO6sw70eobH7h+AvGGnePvB+geLtLwtrrmnpdmHOWs5eUngb/aikWRD/ALvvWDVnY3Tujr6QwoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD80/20/Hran4p0T4fWcxNn4atBrOrorfK97dqRCjD1it+f+3o1rBO1zKbV7HxHVkBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB+gX7E3j1t3iX4b3s2V2/8JToCuwG3lIb+Jc+5glwPWQ1nNdTSD6H6DVmaBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAV7y6t7G0ub27kWK1s7d7u6lc4WOONC8jH6KpP4UAfhL4z8TXPjPxb4j8V3ZYzeINZn1MKxz5UcjnyIx7JEIkA/2a6EklZGDberOZoEFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFAHovwk8Xv4E+JHg/xOJCltY6zHBqeDgPZ3P8Ao10D9I5Wb6oKTXMrIcXZ3P3CBBAIO4HowOQw7H8awNxaACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgDwn9pXxK3hj4M+M7iGUxXerWcfhuzKnaxa/kWB8H1ERmP4VUVd2YpNpXR+Nv04HYelbGAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFACEbgVJwGBUn0yMUAft18F/EzeL/hX4F16V99zdeHoLa9YtuZri1BtJyfcvCx/4FWDVnZm6aauj0+kMKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAPhz9uLWmt/Cngfw+r4Gq+IbjVZUBwWSytvLXPtvux+VaU1uzOb0sfm1WhmFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfqV+xdrX2/4WalpDuWk8P8Aiy5hRCc7IrqOG6THoN7zfrWM17xrB6H19UlhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB+aH7cN+ZfHHgrS9+UsfCk18U/utdXjJn8Ra/pWtNaXM5vofE1WZhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFAH6AfsL6jiX4kaQx+8umapGvvm7gc/l5Y/Cs6nQ0h1P0IrM0CgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD8pv2yrgzfGCGInItPB1hEo/u75buT/2atYbGU9z5QqyAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD7X/AGH5ivjzxpb54m8HxTY9TFfRgf8Ao01nU6GkOp+mNZmgUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfk5+2GpX4z3DHo/hPTSvvj7SK1hsZT3PlqrICgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAPs/8AYhQn4i+LHHRPBOD+N/bY/kazqdDSn1P05rM0CgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD8tv21bI2/xU0W6x8t/wCCbZt2MZMN3eRn9Cv51rDYyn8R8gVZAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB9yfsN2jP4p8fX+Dst/D1lZ7uwMt3K+P/IP6VnU6GlPqfpJWZoFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFAH53/tzaSU1D4d66oyJrPUNGkYdiklvcID9Q8h/A1pT6mdTofA9aGYUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB+j37DWltF4c8f60Uwt/r1ppUcn94Wts0rD8DdCs5tXsaQXU+6qzNAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA+SP2zNA/tT4UW+sRxlpvDPia1vXcDJSG5WSzk/DdLCfwq4OzsRNXVz8rq1MgoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKADrQB+u/7J+gnRPgr4dndds3iC8vPEMgI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wxM5eTwv4hM1qC2SltqEfnBQPQTR3H/fVZ1N7msHpY+zazLCgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD84v249eM2v+BPDCONthpN1r06A5+e6lW3iJH+7bS4/3q0p9TOp0PhStDMKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA+zv2JtcFl8QfE+gySbY9d8LC7iTPDy2NwjDA9dlzL+VRU2RcNz9OqyNQoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAPAJ9KAPx7/ak1z+2/jb4sCOXg0SO08Pw5OQpt7ZHlA/7azS1tD4UYzfvHz3VEhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFAHuP7N2tf2F8bPAc5bbHqGoy6DMM4VlvbeWBQf+2hi/ECpn8LKj8SP2XHQZ696xNgoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAyBySAByxJwAB1J/CgD8HPGmst4i8YeK9eZi51nxJfaiGJzlZbmVk/8d2/lXQlZWMG23qc1QIKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA3fC+qvoXibw5rcbFX0jX7LUww6gQXMUjfoppSV1Yadnc/epWVwHVgyv8AOrA5DA8gj8CKwNxaACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA474hawvh/wH4z1tn8s6V4Wv76NumHS1l2c/7xWmld2Qm7H4TqCFUNncFAbJySQOa3MBaACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAGuCUcDqyEDHUEggUAfuz8PNVGu+AvBesB/MOp+FdPvHb1d7WLf/AOPBq5zoWx2NABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfP37UWqjS/gh41wxSTU4rXRYiDgn7VeQI4/74D/hmqh8SJl8LPx4PJJ9a2MQoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAUHBB9DmgD9jv2ZNSGp/A/wI5cu9jY3GkyZ6qbW8nhA/BQlYy+I2i7xPeakoKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD45/bX1P7L8MtC0xTh9W8Zwbhnlktra5mP4bin6VpBa3Im9LH5e1oZBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfqh+xhqAu/hJeWZfLaV4xvbcL3RZo7a5UfnIx/GsZ/EzaHwn1xUlBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfn9+3RqAEXw20oH702p6m65/uraQKT/32+PxrSn1M6nQ/PitDMKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD9HP2Gbwv4e+IWn54ttesr5Vz08+1eMnH1twKzqdDSn1PuyszQKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD8zf24Lsv488GWO75bXwjLclfQz3rjP5QCtYLS5nNrY+KaszCgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA+8f2GLsrrHxGsM8TaZpt4Fz/AM85ruMn/wAiCs6nQ0h1P0XrM0CgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA/Kn9sy5M/wAXraEnP2PwZYQ4znbvmvJf131tD4TGfxHybVEhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfaf7EE234geMYM4E3g1JMepjvof6SH86zqdDSG7P01rM0CgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA/JP9rxy3xs1VT0j8OaWg9swyN/WtofCYz+I+Y6okKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD7E/Ymcr8UtfXs/ga4z+F7Y/wCNZ1OhpT6n6iVmaBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAfkj+12pHxu1gno/h3S2H08hx/Q1tD4UYz+I+ZaokKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD7E/YmQt8UtfftH4GuAf+BXtlj+VZ1OhpT6n6iVmaBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAflR+2ZaNb/F63nIwL/wAG2E4OOuyW7iP/AKBW0PhMZ/EfJ1USFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB9s/sPWxbxz42vNuVt/CUFsW9DNeq38oT+VZ1OhpDqfpfWZoFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB+cH7cmkvF4j8A66FPl3uiXukMwXjdbXEc6gn123LY9ga1pvdGc0tz4WqzMKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD9Df2GNLK2XxG1plOJr3TtIifHB8qO4uHAP/bePP1FZz6GkF1PvuszQKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACg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BQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQB//2Q==';
    constructor(personalityData) {
        this.name = personalityData.name;
        this.description = personalityData.description;
        this.id = personalityData.id || webSkel.appServices.generateId();
        this.image = personalityData.image||Personality.defaultPersonalityImage;
    }
    update(personalityData){
        this.name = personalityData.name;
        this.description = personalityData.description;
        if(personalityData.image){
            this.image = personalityData.image;
        }
    }

    simplify(){
        return {
            name: this.name,
            id: this.id
        }
    }
}