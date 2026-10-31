import SwiftUI

private let teal = Color(red: 0x6f / 255, green: 0xc3 / 255, blue: 0xae / 255)
private let amber = Color(red: 0xe9 / 255, green: 0xa5 / 255, blue: 0x4a / 255)
private let track = Color(red: 0x1d / 255, green: 0x2a / 255, blue: 0x23 / 255)
private let muted = Color(red: 0x93 / 255, green: 0xa3 / 255, blue: 0x9a / 255)
private let restGrey = Color(red: 0x5d / 255, green: 0x6b / 255, blue: 0x64 / 255)

struct ContentView: View {
    @EnvironmentObject var m: SessionModel

    var body: some View {
        let _ = m.tick
        if m.active, let n = m.current() {
            SessionView(n: n)
        } else {
            StartView()
        }
    }
}

// Style A: outer ring = reps, thin inner ring = sets, a glow behind the ring = how hard to push.
struct SessionView: View {
    @EnvironmentObject var m: SessionModel
    let n: SessionModel.Now

    private var waiting: Bool { n.step.kind == "rest" || n.step.kind == "setup" || n.ex.rest }
    private var counting: Bool { n.ex.reps > 1 && !waiting }

    var body: some View {
        ZStack {
            Color.black
            // Whole-screen warmth on exertion: brightest at the edges, fades toward the numbers.
            RadialGradient(colors: [amber.opacity(0.05), amber.opacity(0.32)], center: .center, startRadius: 20, endRadius: 140)
                .opacity(waiting || m.paused ? 0 : m.effort(n))
                .animation(.easeInOut(duration: 0.25), value: m.effort(n))
            RingView(n: n, effort: m.effort(n), waiting: waiting)
            VStack(spacing: 2) {
                Text(header)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(waiting ? muted : teal)
                    .lineLimit(1)
                    .padding(.horizontal, 30)
                Spacer(minLength: 0)
                if counting {
                    HStack(alignment: .firstTextBaseline, spacing: 0) {
                        Text("\(n.step.rep + 1)").font(.system(size: 64, weight: .heavy, design: .rounded))
                        Text("/\(n.ex.reps)").font(.system(size: 22, weight: .bold, design: .rounded)).foregroundColor(muted)
                    }
                } else {
                    Text("\(Int(ceil(n.left)))")
                        .font(.system(size: 64, weight: .heavy, design: .rounded))
                        .foregroundColor(n.step.kind == "hold" ? amber : (waiting ? .white : .white))
                }
                Text(phase)
                    .font(.system(size: 13, weight: .heavy))
                    .tracking(1.5)
                    .foregroundColor(waiting ? muted : amber)
                if waiting, let nx = n.next {
                    Text("Up next: \(nx)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(.horizontal, 26)
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 22)
            if m.paused { PausedOverlay() }
        }
        .ignoresSafeArea()
        .contentShape(Rectangle())
        .onTapGesture { if !m.paused { m.pause() } }
        .gesture(DragGesture(minimumDistance: 25).onEnded { v in
            if v.translation.width < -40 && abs(v.translation.height) < 60 && !m.paused { m.skip() }
        })
    }

    private var header: String {
        if n.step.kind == "setup" { return "Get set" }
        if n.ex.sets > 1 { return "\(n.ex.name) · \(n.ex.set)/\(n.ex.sets)" }
        return n.ex.name
    }

    private var phase: String {
        switch n.step.kind {
        case "up": return "▲ " + (n.step.label.isEmpty ? "UP" : n.step.label.uppercased())
        case "down": return "▼ " + (n.step.label.isEmpty ? "DOWN" : n.step.label.uppercased())
        case "hold": return n.step.label.isEmpty ? "HOLD" : n.step.label.uppercased()
        case "setup": return n.ex.name.uppercased()
        default: return n.step.label.isEmpty ? "REST" : n.step.label.uppercased()
        }
    }
}

struct RingView: View {
    let n: SessionModel.Now
    let effort: Double
    let waiting: Bool

    var body: some View {
        let reps = max(1, n.ex.reps)
        let sets = max(1, n.ex.sets)
        let outer = RoundedRectangle(cornerRadius: 46, style: .continuous)
        let inner = RoundedRectangle(cornerRadius: 34, style: .continuous)
        ZStack {
            // the pressure glow
            outer.inset(by: 6).stroke(amber, lineWidth: 14).blur(radius: 7).opacity(waiting ? 0 : effort * 0.85)
            // reps
            if reps == 1 {
                outer.inset(by: 6).stroke(track, lineWidth: 8)
                outer.inset(by: 6).trim(from: 0, to: max(0.001, 1 - n.frac))
                    .stroke(waiting ? restGrey : amber, style: StrokeStyle(lineWidth: 8, lineCap: .round))
            } else {
                ForEach(0..<reps, id: \.self) { i in
                    let a = Double(i) / Double(reps)
                    let b = Double(i + 1) / Double(reps) - 0.012
                    outer.inset(by: 6).trim(from: a, to: max(a + 0.001, b))
                        .stroke(repColor(i), style: StrokeStyle(lineWidth: 8, lineCap: .butt))
                }
            }
            // sets
            if sets > 1 {
                ForEach(0..<sets, id: \.self) { i in
                    let a = Double(i) / Double(sets)
                    let b = Double(i + 1) / Double(sets) - 0.025
                    inner.inset(by: 18).trim(from: a, to: max(a + 0.001, b))
                        .stroke(i < n.ex.set - 1 ? Color.white : (i == n.ex.set - 1 ? muted : track), lineWidth: 3)
                }
            }
        }
    }

    private func repColor(_ i: Int) -> Color {
        if i < n.step.rep { return teal }
        if i == n.step.rep { return waiting ? track : amber.opacity(0.45 + 0.55 * effort) }
        return track
    }
}

struct PausedOverlay: View {
    @EnvironmentObject var m: SessionModel

    var body: some View {
        ZStack {
            Color.black.opacity(0.78)
            VStack(spacing: 8) {
                Button { m.resume() } label: {
                    Label("Resume", systemImage: "play.fill")
                        .font(.system(size: 18, weight: .bold))
                        .frame(maxWidth: .infinity, minHeight: 46)
                }
                .buttonStyle(.borderedProminent)
                .tint(teal)
                HStack(spacing: 8) {
                    Button { m.skip(); m.resume() } label: {
                        Text("Skip").font(.system(size: 15, weight: .bold)).frame(maxWidth: .infinity, minHeight: 40)
                    }
                    Button(role: .destructive) { m.end() } label: {
                        Text("End").font(.system(size: 15, weight: .bold)).frame(maxWidth: .infinity, minHeight: 40)
                    }
                }
            }
            .padding(.horizontal, 12)
        }
    }
}

struct StartView: View {
    @EnvironmentObject var m: SessionModel

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                if let f = m.finished {
                    Image(systemName: "checkmark")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(teal)
                    Text(f).font(.headline)
                } else {
                    Text("Achilló").font(.headline)
                }
                if m.snackDue {
                    Button { m.start("snack") } label: {
                        Text(m.snackName.isEmpty ? "Quick one" : "Quick one · \(m.snackName)").font(.system(size: 15, weight: .bold)).frame(maxWidth: .infinity).lineLimit(2)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(amber)
                }
                Button { m.start("home") } label: {
                    Text("Barefoot PT").font(.system(size: 16, weight: .bold)).frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(teal)
                Button { m.start("hips") } label: {
                    Text("Hips").font(.system(size: 15, weight: .semibold)).frame(maxWidth: .infinity)
                }
                if !m.snackDue {
                    Button { m.start("snack") } label: {
                        Text(m.snackName.isEmpty ? "Quick one" : "Quick one · \(m.snackName)").font(.system(size: 15, weight: .semibold)).frame(maxWidth: .infinity).lineLimit(2)
                    }
                }
                Button { m.cycleStrength() } label: {
                    Text("Taps: " + ["Normal", "Strong", "Max"][min(2, max(0, m.strength))]).font(.system(size: 14, weight: .semibold)).frame(maxWidth: .infinity)
                }
                Button { m.toggleTextures() } label: {
                    Text("Textures: " + (m.textures ? "On" : "Off")).font(.system(size: 14, weight: .semibold)).frame(maxWidth: .infinity)
                }
                Text(m.phoneReachable ? "Starts on your phone too; the phone plays the voice." : "Open Achilló on your phone to start a session.")
                    .font(.footnote)
                    .foregroundColor(muted)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 4)
        }
    }
}
