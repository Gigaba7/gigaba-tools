$(function (){

    set_target_date();

    function set_target_date(){
        // UI動的生成
        $('body').append('<label for="startDate">開始日:</label><input type="date" id="startDate" />');
        $('body').append('<label for="endDate">終了日:</label><input type="date" id="endDate" />');
        $('body').append('<p id="selectedDates">開始日: なし, 終了日: なし, 日数: なし, 週数: なし, 月数: なし</p>');

        // 変数
        let start_date, end_date, days_diff, weeks_diff, months_diff;

        $('#startDate').on('change', function () {
            start_date = $(this).val();
            updateDatesAndStats();
        });

        $('#endDate').on('change', function () {
            end_date = $(this).val();
            updateDatesAndStats();
        });

        function formatDateString(dateStr) {
            const date = new Date(dateStr);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}/${mm}/${dd}`;
        }

        function getMonday(d) {
            let date = new Date(d);
            let day = date.getDay();
            let diff = (day === 0 ? -6 : 1 - day);
            date.setDate(date.getDate() + diff);
            date.setHours(0, 0, 0, 0);
            return date;
        }

        function getSunday(d) {
            let date = new Date(d);
            let day = date.getDay();
            let diff = (day === 0 ? 0 : 7 - day);
            date.setDate(date.getDate() + diff);
            date.setHours(0, 0, 0, 0);
            return date;
        }

        function getMonthSpan(start, end) {
            const startY = start.getFullYear();
            const startM = start.getMonth();
            const endY = end.getFullYear();
            const endM = end.getMonth();
            return (endY - startY) * 12 + (endM - startM) + 1;
        }

        function updateDatesAndStats() {
            if (start_date && end_date) {
                let start = new Date(start_date);
                let end = new Date(end_date);

                if (start > end) {
                    $('#selectedDates').text('終了日は開始日より後にしてください。');
                    return;
                }

                // 日数
                days_diff = (end - start) / (1000 * 60 * 60 * 24);

                // 月曜始まりの週数
                let week_start = getMonday(start);
                let week_end = getSunday(end);
                weeks_diff = Math.ceil((week_end - week_start) / (1000 * 60 * 60 * 24) / 7);

                // 月数（開始月～終了月をカウント）
                months_diff = getMonthSpan(start, end);

                const formattedStart = formatDateString(start_date);
                const formattedEnd = formatDateString(end_date);

                $('#selectedDates').html(`
                    <span class="item"><strong>開始日:</strong> ${formattedStart}</span>
                    <span class="item"><strong>終了日:</strong> ${formattedEnd}</span>
                    <span class="item"><strong>日数:</strong> ${days_diff}日</span>
                    <span class="item"><strong>週数:</strong> ${weeks_diff}週間</span>
                    <span class="item"><strong>月数:</strong> ${months_diff}か月</span>
                `);                

                orundum_counter(days_diff, weeks_diff, months_diff);
            }
        }
    }

    let orundum_count = {
        'normal':{days:100,weeks:1800,months:0,value:0}, // 通常入手量
        'pass':{days:300,weeks:1800,months:1080,value:650}, // 月パス
        'special':{days:300,weeks:1800,months:14640,value:2600} // 月パス＋月間スカウトチケット
    };

    function orundum_counter(days_diff,weeks_diff,months_diff){
        
        const normal_result = calculator('normal',days_diff,weeks_diff,months_diff);
        const pass_result = calculator('pass',days_diff,weeks_diff,months_diff);
        const special_result = calculator('special',days_diff,weeks_diff,months_diff);

        // 結果を600で割って切り捨て
        const normal_count_result = Math.floor(normal_result / 600);
        const pass_count_result = Math.floor(pass_result / 600);
        const special_count_result = Math.floor(special_result / 600);

        const normal_value_total = orundum_count['normal'].value * months_diff;
        const pass_value_total = orundum_count['pass'].value * months_diff;
        const special_value_total = orundum_count['special'].value * months_diff;
        
        // 天井数（300連で1天井、小数第2位まで表示）
        const normal_ceiling = (normal_count_result / 300).toFixed(2);
        const pass_ceiling = (pass_count_result / 300).toFixed(2);
        const special_ceiling = (special_count_result / 300).toFixed(2);

        // 結果をHTMLに出力
        $('#normal_orundum').text(`${normal_result} 合成玉`);
        $('#normal_scout').text(`${normal_count_result} 連分`);
        $('#normal_value').text(`価値: ${normal_value_total.toLocaleString()}円`);
        $('#normal_ceiling').text(`天井: ${normal_ceiling} 回`);
        
        $('#pass_orundum').text(`${pass_result} 合成玉`);
        $('#pass_scout').text(`${pass_count_result} 連分`);
        $('#pass_value').text(`価値: ${pass_value_total.toLocaleString()}円`);
        $('#pass_ceiling').text(`天井: ${pass_ceiling} 回`);
        
        $('#special_orundum').text(`${special_result} 合成玉`);
        $('#special_scout').text(`${special_count_result} 連分`);
        $('#special_value').text(`価値: ${special_value_total.toLocaleString()}円`);
        $('#special_ceiling').text(`天井: ${special_ceiling} 回`);
    }

    function calculator(status,days_diff,weeks_diff,months_diff){
        const result = orundum_count[status]['days'] * days_diff + orundum_count[status]['weeks'] * weeks_diff + orundum_count[status]['months'] * months_diff;
        return result;
    }
})