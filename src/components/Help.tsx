export default function Help() {
  return (
    <div className="help">
      <h2 className="page-title">User Guide</h2>

      <div className="help-body">
        <p className="help-intro">
          BellCraft builds a bell schedule from a few settings, then lets you fine-tune individual
          periods before exporting. Here's how each part works.
        </p>

        <section className="help-section">
          <h3>The basics</h3>
          <p>
            In the <strong>Builder</strong> tab, set a start time, end time, and number of periods.
            BellCraft divides the time between start and end evenly across your periods, after
            subtracting passing time, lunch, breaks, and any special blocks you've added. Click
            <strong> Generate Schedule</strong> to build it — the result appears on the right.
          </p>
          <p>
            If your settings don't leave enough time to fit everything, the Generate button
            disables and an error explains what to shorten.
          </p>
        </section>

        <section className="help-section">
          <h3>Passing time</h3>
          <p>
            Passing time is added once between each pair of periods — never before Period 1. Locked
            blocks (lunch, breaks, special blocks) generally don't get their own separate passing
            gap; see the Break and Split Lunch sections below for exactly how each one handles it.
          </p>
        </section>

        <section className="help-section">
          <h3>Lunch</h3>
          <p>
            Set a lunch length and how many lunch waves to run, then choose which period lunch
            follows. With more than one lunch wave, they're named Lunch A, Lunch B, and so on, and
            run back-to-back after that period.
          </p>
        </section>

        <section className="help-section">
          <h3>Split lunch</h3>
          <p>
            Turn on <strong>Split lunch within a period</strong> when lunch happens <em>during</em>{' '}
            a class period instead of its own separate slot — half the students eat while the other
            half are in class, then they swap. Pick which period splits; it still gets a full,
            normal-length period for everyone, just split into two pieces (e.g. Period 4A and 4B)
            with two lunch waves interleaved.
          </p>
          <p>
            By default, lunch starts the instant the prior period ends, with one passing gap between
            the lunch and class portions of each track. If your school also wants a passing gap{' '}
            <em>before</em> the swap (not just between lunch and class), turn on{' '}
            <strong>Add passing time on both sides of the swap</strong>.
          </p>
        </section>

        <section className="help-section">
          <h3>Break</h3>
          <p>
            Turn on <strong>Add a break</strong> and choose <strong>Break Before Period</strong> —
            the period the break should land right before. If any special blocks (like homeroom)
            are also scheduled at that same spot, the break is placed after them, so it lands
            immediately before class resumes.
          </p>
          <p>
            When a break directly follows a period, it absorbs that period's passing time into its
            own displayed length (so a 5-minute break shows as 10 minutes on the schedule — 5 for
            passing, 5 for the break itself). When something else comes first, like a special block,
            the break shows its plain length instead, and the passing gap reappears right before the
            next period.
          </p>
        </section>

        <section className="help-section">
          <h3>Special blocks</h3>
          <p>
            Use this for anything else non-instructional — homeroom, an assembly, a pep rally.
            Give it a name, a length, and where it goes: before Period 1, or after any period. Special
            blocks are locked by default and never split time with other periods.
          </p>
        </section>

        <section className="help-section">
          <h3>Preferences</h3>
          <p>
            Add a standing rule like "Period 1 should run 5 minutes longer than the rest" — enter
            the period and how many minutes longer (or shorter, using a negative number). This is
            calculated up front every time you generate, spreading the difference evenly across the
            other periods, so it stays consistent even if you change other settings afterward.
          </p>
        </section>

        <section className="help-section">
          <h3>Editing after you generate</h3>
          <p>
            Once a schedule is generated, every period's <strong>Duration</strong> is editable —
            click into the box and type a new value. BellCraft redistributes the difference across
            the other unlocked periods automatically, and a notification bar explains what changed.
          </p>
          <ul>
            <li><strong>Lock</strong> a period to protect it from ever absorbing a redistribution.</li>
            <li><strong>Reset</strong> (the small icon on a row) reverts just that one period.</li>
            <li><strong>Reset</strong> (top of the table) reverts every period back to its generated values.</li>
          </ul>
          <p>
            The summary bar at the bottom always reflects the current state: number of periods,
            total instructional minutes, the common base period length, and the actual end time.
          </p>
        </section>

        <section className="help-section">
          <h3>Exporting</h3>
          <p>
            Use <strong>PDF</strong> for a printable schedule with your school name and logo (set
            those in Settings), or <strong>CSV</strong> to get the raw times into a spreadsheet.
          </p>
        </section>

        <section className="help-section">
          <h3>Library</h3>
          <p>
            <strong>Save to Library</strong> stores the current schedule for later. Click any saved
            card to load it back into the Builder, or use the × to delete it. Schedules are saved
            in your browser, so they'll stay put on this device but won't follow you to another one.
          </p>
        </section>

        <section className="help-section">
          <h3>Settings</h3>
          <p>
            Set your school's name, default start/end time, default number of periods, and an
            optional logo. These become the starting point for new schedules and appear on PDF
            exports.
          </p>
        </section>
      </div>
    </div>
  );
}
